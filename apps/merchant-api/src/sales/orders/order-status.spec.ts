import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq, orderEventsTable, ordersTable } from 'db/sales';
import {
  insertAccount,
  insertOrder,
  insertUser,
  useTestDb,
} from 'test-support';
import { DRIZZLE } from 'src/shared/database/database.constants';
import { OrdersService } from './orders.service';
import {
  ALLOWED_TRANSITIONS,
  ORDER_STATUSES,
  canTransition,
  type OrderStatus,
} from './order-status';

const db = useTestDb();

async function build() {
  const ref = await Test.createTestingModule({
    providers: [OrdersService, { provide: DRIZZLE, useValue: db }],
  }).compile();
  return { service: ref.get(OrdersService) };
}

async function seedOrder(status: OrderStatus = 'paid') {
  const account = await insertAccount(db);
  const staff = await insertUser(db, { accountId: account.id });
  const order = await insertOrder(db, { accountId: account.id, status });
  // age updated_at so a bump is unambiguous
  await db
    .update(ordersTable)
    .set({ updatedAt: new Date('2000-01-01T00:00:00Z') })
    .where(eq(ordersTable.id, order.id));
  return { accountId: account.id, orderId: order.id, staffId: staff.id };
}

function eventsFor(orderId: number) {
  return db
    .select()
    .from(orderEventsTable)
    .where(eq(orderEventsTable.orderId, orderId));
}

describe('order-status state machine', () => {
  it('every status is a key and only lists real statuses as targets', () => {
    for (const from of ORDER_STATUSES) {
      expect(ALLOWED_TRANSITIONS[from]).toBeDefined();
      for (const to of ALLOWED_TRANSITIONS[from]) {
        expect(ORDER_STATUSES).toContain(to);
      }
    }
  });

  it('allows the lifecycle moves and rejects the rest', () => {
    expect(canTransition('paid', 'canceled')).toBe(true);
    expect(canTransition('paid', 'refunded')).toBe(true);
    expect(canTransition('partially_refunded', 'refunded')).toBe(true);
    expect(canTransition('payment_failed', 'paid')).toBe(true);
    // a fully-refunded order can still be marked canceled (OS-125 cancel)
    expect(canTransition('refunded', 'canceled')).toBe(true);

    expect(canTransition('paid', 'pending')).toBe(false);
    expect(canTransition('canceled', 'paid')).toBe(false);
    expect(canTransition('refunded', 'paid')).toBe(false);
    expect(canTransition('canceled', 'canceled')).toBe(false);
  });
});

describe('OrdersService.updateStatus', () => {
  it('applies a legal move, bumps updated_at, and writes one status_changed event', async () => {
    const { orderId, accountId, staffId } = await seedOrder('payment_failed');
    const { service } = await build();

    const result = await service.updateStatus(
      orderId,
      accountId,
      { status: 'canceled', reason: 'customer never paid' },
      staffId,
    );

    expect(result).toEqual({
      id: orderId,
      status: 'canceled',
      previousStatus: 'payment_failed',
    });

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId));
    expect(order.status).toBe('canceled');
    expect(order.updatedAt.getUTCFullYear()).toBeGreaterThan(2000);

    const events = await eventsFor(orderId);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'status_changed',
      data: { from: 'payment_failed', to: 'canceled' },
      actorType: 'staff',
      actorUserId: staffId,
    });
    expect(events[0].message).toContain('payment_failed');
    expect(events[0].message).toContain('customer never paid');
  });

  it('rejects an illegal transition with a 409 and changes nothing', async () => {
    const { orderId, accountId } = await seedOrder('canceled');
    const { service } = await build();

    await expect(
      service.updateStatus(orderId, accountId, { status: 'paid' }, 1),
    ).rejects.toBeInstanceOf(ConflictException);

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId));
    expect(order.status).toBe('canceled');
    expect(await eventsFor(orderId)).toHaveLength(0);
  });

  it('rejects setting a refund status by hand (use the refund endpoint)', async () => {
    const { orderId, accountId } = await seedOrder('paid');
    const { service } = await build();

    await expect(
      service.updateStatus(orderId, accountId, { status: 'refunded' }, 1),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.updateStatus(
        orderId,
        accountId,
        { status: 'partially_refunded' },
        1,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(await eventsFor(orderId)).toHaveLength(0);
  });

  it('404s for an order on another account', async () => {
    const { orderId } = await seedOrder('paid');
    const other = await insertAccount(db);
    const { service } = await build();

    await expect(
      service.updateStatus(orderId, other.id, { status: 'canceled' }, 1),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
