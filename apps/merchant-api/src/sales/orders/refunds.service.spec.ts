import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  and,
  eq,
  orderEventsTable,
  orderPaymentsTable,
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
import { RefundsService } from './refunds.service';
import { PAYMENTS_PORT } from './ports/payments.port';

const db = useTestDb();

const START_STOCK = 10;

async function build(refundPaymentIntent: jest.Mock) {
  const ref = await Test.createTestingModule({
    providers: [
      RefundsService,
      { provide: DRIZZLE, useValue: db },
      { provide: PAYMENTS_PORT, useValue: { refundPaymentIntent } },
    ],
  }).compile();
  return { service: ref.get(RefundsService), refundPaymentIntent };
}

// a paid web order: 2 units of a $50 variant, sold from one location, plus a
// stripe order_payments row for the full $100.
async function seedPaidWebOrder(over?: {
  channel?: 'web' | 'pos';
  status?: 'paid' | 'partially_refunded' | 'refunded';
  withStripePayment?: boolean;
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
  if (over?.withStripePayment !== false) {
    await insertOrderPayment(db, {
      orderId: order.id,
      method: 'stripe',
      amountCents: priceCents * qty,
      stripePaymentIntentId: 'pi_test_1',
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
    variantId: variant.id,
    locationId: location.id,
    totalCents: priceCents * qty,
  };
}

const paymentsFor = (orderId: number) =>
  db
    .select()
    .from(orderPaymentsTable)
    .where(eq(orderPaymentsTable.orderId, orderId))
    .orderBy(orderPaymentsTable.id);

async function statusOf(orderId: number) {
  const [row] = await db
    .select({ status: ordersTable.status })
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));
  return row.status;
}

async function stockAt(variantId: number, locationId: number) {
  const [row] = await db
    .select({ stock: inventoryTable.stock })
    .from(inventoryTable)
    .where(
      and(
        eq(inventoryTable.variantId, variantId),
        eq(inventoryTable.locationId, locationId),
      ),
    );
  return row.stock;
}

describe('RefundsService.refundOrder', () => {
  it('refunds the full amount via the port and records the refund + restock', async () => {
    const s = await seedPaidWebOrder();
    const { service, refundPaymentIntent } = await build(
      jest.fn().mockResolvedValue({ stripeRefundId: 're_test_1' }),
    );

    const result = await service.refundOrder(
      s.orderId,
      s.accountId,
      { reason: 'customer return' },
      s.staffId,
    );

    expect(refundPaymentIntent).toHaveBeenCalledWith({
      accountId: s.accountId,
      paymentIntentId: 'pi_test_1',
      amountCents: s.totalCents,
      idempotencyKey: `refund-order-${s.orderId}-full`,
    });

    expect(result).toMatchObject({
      orderId: s.orderId,
      amountCents: s.totalCents,
      stripeRefundId: 're_test_1',
      status: 'refunded',
    });

    const payments = await paymentsFor(s.orderId);
    expect(payments[1]).toMatchObject({
      method: 'stripe',
      amountCents: -s.totalCents,
      stripeRefundId: 're_test_1',
      parentPaymentId: payments[0].id,
    });
    expect(await statusOf(s.orderId)).toBe('refunded');
    expect(await stockAt(s.variantId, s.locationId)).toBe(START_STOCK);
  });

  it('skips restock when restock: false', async () => {
    const s = await seedPaidWebOrder();
    const { service } = await build(
      jest.fn().mockResolvedValue({ stripeRefundId: 're_test_2' }),
    );

    await service.refundOrder(
      s.orderId,
      s.accountId,
      { restock: false },
      s.staffId,
    );

    expect(await stockAt(s.variantId, s.locationId)).toBe(START_STOCK - 2);
    const returns = await db
      .select()
      .from(inventoryMovementsTable)
      .where(eq(inventoryMovementsTable.reason, 'return'));
    expect(returns).toHaveLength(0);
    expect(await statusOf(s.orderId)).toBe('refunded');
  });

  it('is idempotent-safe: a second refund on the now-refunded order is a 409', async () => {
    const s = await seedPaidWebOrder();
    const create = jest
      .fn()
      .mockResolvedValueOnce({ stripeRefundId: 're_first' })
      .mockResolvedValueOnce({ stripeRefundId: 're_first' });
    const { service } = await build(create);

    await service.refundOrder(s.orderId, s.accountId, {}, s.staffId);
    await expect(
      service.refundOrder(s.orderId, s.accountId, {}, s.staffId),
    ).rejects.toBeInstanceOf(ConflictException);

    // exactly one refund row, no second Stripe call
    const payments = await paymentsFor(s.orderId);
    expect(payments).toHaveLength(2);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('rejects a POS order', async () => {
    const s = await seedPaidWebOrder({ channel: 'pos' });
    const { service, refundPaymentIntent } = await build(jest.fn());

    await expect(
      service.refundOrder(s.orderId, s.accountId, {}, s.staffId),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(refundPaymentIntent).not.toHaveBeenCalled();
  });

  it('rejects an order with no Stripe payment', async () => {
    const s = await seedPaidWebOrder({ withStripePayment: false });
    const { service } = await build(jest.fn());

    await expect(
      service.refundOrder(s.orderId, s.accountId, {}, s.staffId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an order already in a terminal status', async () => {
    const s = await seedPaidWebOrder({ status: 'refunded' });
    const { service } = await build(jest.fn());

    await expect(
      service.refundOrder(s.orderId, s.accountId, {}, s.staffId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('404s for another account', async () => {
    const s = await seedPaidWebOrder();
    const other = await insertAccount(db);
    const { service } = await build(jest.fn());

    await expect(
      service.refundOrder(s.orderId, other.id, {}, s.staffId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('leaves nothing written when the Stripe refund fails', async () => {
    const s = await seedPaidWebOrder();
    const { service } = await build(
      jest.fn().mockRejectedValue(new ConflictException('stripe boom')),
    );

    await expect(
      service.refundOrder(s.orderId, s.accountId, {}, s.staffId),
    ).rejects.toThrow();

    expect(await paymentsFor(s.orderId)).toHaveLength(1);
    expect(await statusOf(s.orderId)).toBe('paid');
    const events = await db
      .select()
      .from(orderEventsTable)
      .where(eq(orderEventsTable.orderId, s.orderId));
    expect(events).toHaveLength(0);
  });
});
