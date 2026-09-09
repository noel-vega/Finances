import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  and,
  eq,
  fulfillmentsTable,
  orderEventsTable,
  orderPaymentsTable,
  orderRefundLinesTable,
  ordersTable,
} from 'db/sales';
import { inventoryMovementsTable, inventoryTable } from 'db/stock';
import {
  insertAccount,
  insertLocation,
  insertOrder,
  insertOrderItem,
  insertOrderPayment,
  insertProductWithVariants,
  insertUser,
  useTestDb,
} from 'test-support';
import { DRIZZLE } from 'src/shared/database/database.constants';
import { CancelService } from './cancel.service';
import { PAYMENTS_PORT } from './ports/payments.port';

const db = useTestDb();
const START_STOCK = 10;

async function build(refundPaymentIntent: jest.Mock) {
  const ref = await Test.createTestingModule({
    providers: [
      CancelService,
      { provide: DRIZZLE, useValue: db },
      { provide: PAYMENTS_PORT, useValue: { refundPaymentIntent } },
    ],
  }).compile();
  return { service: ref.get(CancelService), refundPaymentIntent };
}

// 2 units of a $50 variant, sold from one location.
async function seedOrder(over?: {
  channel?: 'web' | 'pos';
  status?: 'paid' | 'partially_refunded' | 'payment_failed';
  stripePayment?: boolean;
}) {
  const priceCents = 5000;
  const qty = 2;
  const account = await insertAccount(db);
  const staff = await insertUser(db, { accountId: account.id });
  const location = await insertLocation(db, { accountId: account.id });
  const [variant] = await insertProductWithVariants(db, {
    accountId: account.id,
    variants: [
      { priceCents, stock: [{ locationId: location.id, stock: START_STOCK }] },
    ],
  });
  const order = await insertOrder(db, {
    accountId: account.id,
    channel: over?.channel ?? 'web',
    status: over?.status ?? 'paid',
    subtotalCents: priceCents * qty,
    amountTotalCents: priceCents * qty,
  });
  if (over?.stripePayment !== false) {
    await insertOrderPayment(db, {
      orderId: order.id,
      method: over?.channel === 'pos' ? 'card' : 'stripe',
      amountCents: priceCents * qty,
      stripePaymentIntentId: over?.channel === 'pos' ? null : 'pi_test_1',
    });
  }
  const item = await insertOrderItem(db, {
    orderId: order.id,
    variantId: variant.id,
    priceCents,
    quantity: qty,
  });
  await db.insert(inventoryMovementsTable).values({
    orderItemId: item.id,
    variantId: variant.id,
    locationId: location.id,
    delta: -qty,
    reason: 'sold',
  });
  await db
    .update(inventoryTable)
    .set({ stock: START_STOCK - qty })
    .where(
      and(
        eq(inventoryTable.variantId, variant.id),
        eq(inventoryTable.locationId, location.id),
      ),
    );
  return {
    accountId: account.id,
    staffId: staff.id,
    orderId: order.id,
    itemId: item.id,
    paymentId:
      over?.stripePayment === false
        ? undefined
        : (
            await db
              .select({ id: orderPaymentsTable.id })
              .from(orderPaymentsTable)
              .where(eq(orderPaymentsTable.orderId, order.id))
          )[0].id,
    variantId: variant.id,
    locationId: location.id,
    totalCents: priceCents * qty,
  };
}

const statusOf = async (orderId: number) =>
  (
    await db
      .select({ status: ordersTable.status })
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
  )[0].status;

const stockAt = async (variantId: number, locationId: number) =>
  (
    await db
      .select({ stock: inventoryTable.stock })
      .from(inventoryTable)
      .where(
        and(
          eq(inventoryTable.variantId, variantId),
          eq(inventoryTable.locationId, locationId),
        ),
      )
  )[0].stock;

const eventTypes = async (orderId: number) =>
  (
    await db
      .select({ type: orderEventsTable.type })
      .from(orderEventsTable)
      .where(eq(orderEventsTable.orderId, orderId))
      .orderBy(orderEventsTable.id)
  ).map((e) => e.type);

const paymentsFor = (orderId: number) =>
  db
    .select()
    .from(orderPaymentsTable)
    .where(eq(orderPaymentsTable.orderId, orderId))
    .orderBy(orderPaymentsTable.id);

describe('CancelService.cancelOrder', () => {
  it('unfulfilled paid web order: refund + restock + canceled, one flow', async () => {
    const s = await seedOrder();
    const { service, refundPaymentIntent } = await build(
      jest.fn().mockResolvedValue({ stripeRefundId: 're_cancel_1' }),
    );

    const result = await service.cancelOrder(
      s.orderId,
      s.accountId,
      { reason: 'changed their mind' },
      s.staffId,
    );

    expect(result).toEqual({
      orderId: s.orderId,
      status: 'canceled',
      refundIssued: true,
      refundAmountCents: s.totalCents,
    });
    expect(refundPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: s.totalCents,
        idempotencyKey: `refund-order-${s.orderId}-cancel`,
      }),
    );
    expect(await statusOf(s.orderId)).toBe('canceled');
    expect(await stockAt(s.variantId, s.locationId)).toBe(START_STOCK);

    const payments = await paymentsFor(s.orderId);
    expect(payments).toHaveLength(2);
    expect(payments[1]).toMatchObject({
      amountCents: -s.totalCents,
      stripeRefundId: 're_cancel_1',
    });
    expect(await eventTypes(s.orderId)).toEqual([
      'status_changed', // paid -> refunded
      'refund',
      'status_changed', // refunded -> canceled
      'cancellation',
    ]);
  });

  it('rejects an order that has been fulfilled', async () => {
    const s = await seedOrder();
    await db.insert(fulfillmentsTable).values({
      orderId: s.orderId,
      locationId: s.locationId,
      amountCents: 500,
    });
    const { service, refundPaymentIntent } = await build(jest.fn());

    await expect(
      service.cancelOrder(s.orderId, s.accountId, {}, s.staffId),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(refundPaymentIntent).not.toHaveBeenCalled();
    expect(await statusOf(s.orderId)).toBe('paid');
  });

  it('POS order: restock + canceled, no Stripe refund', async () => {
    const s = await seedOrder({ channel: 'pos' });
    const { service, refundPaymentIntent } = await build(jest.fn());

    const result = await service.cancelOrder(
      s.orderId,
      s.accountId,
      {},
      s.staffId,
    );

    expect(result).toMatchObject({ refundIssued: false, refundAmountCents: 0 });
    expect(refundPaymentIntent).not.toHaveBeenCalled();
    expect(await statusOf(s.orderId)).toBe('canceled');
    expect(await stockAt(s.variantId, s.locationId)).toBe(START_STOCK);
    expect(await eventTypes(s.orderId)).toEqual([
      'status_changed', // paid -> canceled
      'cancellation',
    ]);
  });

  it('payment_failed order: canceled + restock, no Stripe refund', async () => {
    const s = await seedOrder({
      status: 'payment_failed',
      stripePayment: false,
    });
    const { service, refundPaymentIntent } = await build(jest.fn());

    await service.cancelOrder(s.orderId, s.accountId, {}, s.staffId);

    expect(refundPaymentIntent).not.toHaveBeenCalled();
    expect(await statusOf(s.orderId)).toBe('canceled');
    expect(await stockAt(s.variantId, s.locationId)).toBe(START_STOCK);
  });

  it('a second cancel is a 409', async () => {
    const s = await seedOrder();
    const { service } = await build(
      jest.fn().mockResolvedValue({ stripeRefundId: 're_1' }),
    );

    await service.cancelOrder(s.orderId, s.accountId, {}, s.staffId);
    await expect(
      service.cancelOrder(s.orderId, s.accountId, {}, s.staffId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('404s for another account', async () => {
    const s = await seedOrder();
    const other = await insertAccount(db);
    const { service } = await build(jest.fn());

    await expect(
      service.cancelOrder(s.orderId, other.id, {}, s.staffId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('nets out a prior partial-refund restock (does not double-restock)', async () => {
    const s = await seedOrder({ status: 'partially_refunded' });
    // simulate a prior line refund of 1 unit: negative payment row +
    // order_refund_lines + a `return` movement + stock bump
    const [priorRefund] = await db
      .insert(orderPaymentsTable)
      .values({
        orderId: s.orderId,
        method: 'stripe',
        amountCents: -5000,
        stripeRefundId: 're_prior',
        parentPaymentId: s.paymentId!,
      })
      .returning({ id: orderPaymentsTable.id });
    await db.insert(orderRefundLinesTable).values({
      refundPaymentId: priorRefund.id,
      orderItemId: s.itemId,
      quantity: 1,
    });
    await db.insert(inventoryMovementsTable).values({
      orderItemId: s.itemId,
      variantId: s.variantId,
      locationId: s.locationId,
      delta: 1,
      reason: 'return',
    });
    await db
      .update(inventoryTable)
      .set({ stock: START_STOCK - 1 })
      .where(
        and(
          eq(inventoryTable.variantId, s.variantId),
          eq(inventoryTable.locationId, s.locationId),
        ),
      );

    const { service, refundPaymentIntent } = await build(
      jest.fn().mockResolvedValue({ stripeRefundId: 're_cancel' }),
    );

    const result = await service.cancelOrder(
      s.orderId,
      s.accountId,
      {},
      s.staffId,
    );

    // only the $50 balance still outstanding is refunded
    expect(refundPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 5000 }),
    );
    expect(result).toMatchObject({ refundAmountCents: 5000 });
    // stock ends at START_STOCK (1 restocked before, 1 by cancel) — not over
    expect(await stockAt(s.variantId, s.locationId)).toBe(START_STOCK);
    expect(await statusOf(s.orderId)).toBe('canceled');
  });
});
