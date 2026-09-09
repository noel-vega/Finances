import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  type db as Db,
  eq,
  fulfillmentsTable,
  inArray,
  orderEventsTable,
  orderItemsTable,
  orderPaymentsTable,
  ordersTable,
  sql,
} from 'db/sales';
import { inventoryMovementsTable } from 'db/stock';
import { DRIZZLE } from 'src/shared/database/database.constants';
import { OrderCancellation } from './entities/order-cancellation.entity';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { PAYMENTS_PORT, type PaymentsPort } from './ports/payments.port';
import { transitionOrderStatus } from './order-status';
import {
  applyRestock,
  recordRefund,
  resolveRestockTargets,
  type RestockLine,
} from './refunds';

const CANCELLABLE = new Set([
  'paid',
  'partially_refunded',
  'payment_failed',
  'pending',
]);

@Injectable()
export class CancelService {
  constructor(
    @Inject(DRIZZLE) private readonly db: typeof Db,
    @Inject(PAYMENTS_PORT) private readonly payments: PaymentsPort,
  ) {}

  // Cancel an un-fulfilled order: refund it (paid web orders), return every
  // item to stock, mark it canceled — all in one transaction.
  async cancelOrder(
    orderId: number,
    accountId: number,
    dto: CancelOrderDto,
    actorUserId: number,
  ): Promise<OrderCancellation> {
    const [order] = await this.db
      .select({
        id: ordersTable.id,
        accountId: ordersTable.accountId,
        channel: ordersTable.channel,
        status: ordersTable.status,
      })
      .from(ordersTable)
      .where(
        and(eq(ordersTable.id, orderId), eq(ordersTable.accountId, accountId)),
      );
    if (!order) throw new NotFoundException();

    if (!CANCELLABLE.has(order.status)) {
      throw new ConflictException(
        `Cannot cancel an order in status '${order.status}'`,
      );
    }

    const [fulfilled] = await this.db
      .select({ id: fulfillmentsTable.id })
      .from(fulfillmentsTable)
      .where(eq(fulfillmentsTable.orderId, orderId))
      .limit(1);
    if (fulfilled) {
      throw new ConflictException(
        'Cannot cancel an order that has already been fulfilled',
      );
    }

    const payments = await this.db
      .select()
      .from(orderPaymentsTable)
      .where(eq(orderPaymentsTable.orderId, orderId));
    const netCollectedCents = payments.reduce((n, p) => n + p.amountCents, 0);
    const tender = payments.find(
      (p) =>
        p.method === 'stripe' && p.stripePaymentIntentId && p.amountCents > 0,
    );
    // a paid web order gets a Stripe refund on cancel; a POS order's card/cash
    // refund is handled out of band (M3), and payment_failed/pending never
    // collected anything
    const refund =
      order.channel === 'web' &&
      tender?.stripePaymentIntentId &&
      netCollectedCents > 0
        ? {
            parentPaymentId: tender.id,
            paymentIntentId: tender.stripePaymentIntentId,
          }
        : null;

    const items = await this.db
      .select({ id: orderItemsTable.id, quantity: orderItemsTable.quantity })
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId));
    const priorReturns = await this.returnedQtyByItem(items.map((i) => i.id));

    let stripeRefundId: string | undefined;
    if (refund) {
      // Stripe first; a failed DB write below is reconciled by the
      // charge.refunded webhook (OS-127).
      ({ stripeRefundId } = await this.payments.refundPaymentIntent({
        accountId: order.accountId,
        paymentIntentId: refund.paymentIntentId,
        amountCents: netCollectedCents,
        idempotencyKey: `refund-order-${orderId}-cancel`,
      }));
    }

    return this.db.transaction(async (tx) => {
      let restockLines: RestockLine[] = [];
      for (const item of items) {
        const qty = item.quantity - (priorReturns.get(item.id) ?? 0);
        if (qty <= 0) continue;
        restockLines = restockLines.concat(
          await resolveRestockTargets(tx, {
            orderItemId: item.id,
            quantity: qty,
          }),
        );
      }

      if (refund && stripeRefundId) {
        await recordRefund(tx, {
          orderId,
          parentPaymentId: refund.parentPaymentId,
          grossAmountCents: netCollectedCents,
          stripeRefundId,
          reason: dto.reason ?? 'Order canceled',
          restockLines,
          eventLines: items.map((i) => ({
            orderItemId: i.id,
            quantity: i.quantity,
          })),
          actorType: 'staff',
          actorUserId,
        });
      } else {
        await applyRestock(tx, restockLines);
      }

      await transitionOrderStatus(tx, {
        orderId,
        to: 'canceled',
        actorType: 'staff',
        actorUserId,
        reason: dto.reason,
      });

      const refundIssued = refund !== null;
      const refundAmountCents = refundIssued ? netCollectedCents : 0;

      await tx.insert(orderEventsTable).values({
        orderId,
        type: 'cancellation',
        data: { reason: dto.reason ?? null, refundIssued, refundAmountCents },
        message: 'Order canceled' + (dto.reason ? ` — ${dto.reason}` : ''),
        actorType: 'staff',
        actorUserId,
      });

      return {
        orderId,
        status: 'canceled' as const,
        refundIssued,
        refundAmountCents,
      };
    });
  }

  // units already returned to stock per order item (prior partial-refund
  // restocks), so cancel doesn't double-restock them
  private async returnedQtyByItem(
    itemIds: number[],
  ): Promise<Map<number, number>> {
    if (itemIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        orderItemId: inventoryMovementsTable.orderItemId,
        returned: sql<number>`coalesce(sum(${inventoryMovementsTable.delta}), 0)::int`,
      })
      .from(inventoryMovementsTable)
      .where(
        and(
          inArray(inventoryMovementsTable.orderItemId, itemIds),
          eq(inventoryMovementsTable.reason, 'return'),
        ),
      )
      .groupBy(inventoryMovementsTable.orderItemId);
    return new Map(rows.map((r) => [r.orderItemId!, r.returned]));
  }
}
