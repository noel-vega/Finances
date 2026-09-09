import { ConflictException } from '@nestjs/common';
import {
  type db as Db,
  eq,
  orderEventsTable,
  orderStatusEnum,
  ordersTable,
} from 'db/sales';

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export const ORDER_STATUSES = orderStatusEnum.enumValues;

// The order financial lifecycle. Refund / cancel flows (OS-121/122/123/125) and
// the manual correction endpoint all move status through here so the rules and
// the `status_changed` audit event live in exactly one place.
//
//   pending ──▶ paid ──▶ partially_refunded ──▶ refunded
//      │         │              │                  (terminal)
//      │         └──────────────┴──▶ canceled      (terminal)
//      ├──▶ payment_failed ──▶ paid | canceled
//      └──▶ payment_failed | canceled
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> =
  {
    pending: ['paid', 'payment_failed', 'canceled'],
    paid: ['partially_refunded', 'refunded', 'canceled'],
    partially_refunded: ['partially_refunded', 'refunded', 'canceled'],
    payment_failed: ['paid', 'canceled'],
    refunded: [],
    canceled: [],
  };

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new ConflictException(`Cannot move order from '${from}' to '${to}'`);
  }
}

type Executor = Pick<typeof Db, 'select' | 'update' | 'insert'>;

interface TransitionInput {
  orderId: number;
  to: OrderStatus;
  actorType: 'staff' | 'system' | 'customer';
  actorUserId?: number | null;
  // free-text note (staff correction, refund reason) — folded into the event
  reason?: string | null;
  // extra event `data` merged over the automatic `{ from, to }`
  data?: Record<string, unknown>;
  // overrides the auto-composed "Status changed from X to Y" summary
  message?: string;
}

// Validates + applies a status move and records the single `status_changed`
// event. Reads the current status itself (within the caller's transaction, so
// it can't race a concurrent move) — callers pass only the target. Refund /
// cancellation *detail* events are the caller's responsibility; this writes
// only the status change.
export async function transitionOrderStatus(
  executor: Executor,
  input: TransitionInput,
): Promise<{ from: OrderStatus; to: OrderStatus }> {
  const [order] = await executor
    .select({ status: ordersTable.status })
    .from(ordersTable)
    .where(eq(ordersTable.id, input.orderId));
  if (!order) {
    throw new ConflictException(`Order ${input.orderId} not found`);
  }

  const from = order.status;
  assertTransition(from, input.to);

  await executor
    .update(ordersTable)
    .set({ status: input.to, updatedAt: new Date() })
    .where(eq(ordersTable.id, input.orderId));

  await executor.insert(orderEventsTable).values({
    orderId: input.orderId,
    type: 'status_changed',
    data: { from, to: input.to, ...input.data },
    message:
      input.message ??
      `Status changed from ${from} to ${input.to}` +
        (input.reason ? ` — ${input.reason}` : ''),
    actorType: input.actorType,
    actorUserId: input.actorUserId ?? null,
  });

  return { from, to: input.to };
}
