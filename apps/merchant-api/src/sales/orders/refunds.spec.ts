import {
  and,
  eq,
  orderEventsTable,
  orderPaymentsTable,
  ordersTable,
} from 'db/sales';
import { inventoryMovementsTable, inventoryTable, sql } from 'db/stock';
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
import { recordRefund, resolveRestockTargets } from './refunds';

const db = useTestDb();

const START_STOCK = 10;

// A paid web order for one variant whose stock the checkout worker drew from
// `from` (each entry is [locationId, quantity] → a `sold` movement + a
// decrement). Total paid = sum(quantity) * priceCents.
async function seedPaidOrder(
  from: (locations: { a: number; b: number }) => [number, number][],
  priceCents = 5000,
) {
  const account = await insertAccount(db);
  const staff = await insertUser(db, { accountId: account.id });
  const locA = await insertLocation(db, { accountId: account.id });
  const locB = await insertLocation(db, { accountId: account.id });
  const draws = from({ a: locA.id, b: locB.id });
  const qty = draws.reduce((n, [, q]) => n + q, 0);

  const [variant] = await insertProductWithVariants(db, {
    accountId: account.id,
    variants: [
      {
        priceCents,
        stock: [
          { locationId: locA.id, stock: START_STOCK },
          { locationId: locB.id, stock: START_STOCK },
        ],
      },
    ],
  });

  const order = await insertOrder(db, {
    accountId: account.id,
    status: 'paid',
    subtotalCents: priceCents * qty,
    amountTotalCents: priceCents * qty,
  });
  const payment = await insertOrderPayment(db, {
    orderId: order.id,
    method: 'stripe',
    amountCents: priceCents * qty,
    stripePaymentIntentId: 'pi_test_1',
  });
  const item = await insertOrderItem(db, {
    orderId: order.id,
    variantId: variant.id,
    priceCents,
    quantity: qty,
  });

  for (const [locationId, q] of draws) {
    await db.insert(inventoryMovementsTable).values({
      orderItemId: item.id,
      variantId: variant.id,
      locationId,
      delta: -q,
      reason: 'sold',
    });
    await db
      .update(inventoryTable)
      .set({ stock: sql`${inventoryTable.stock} - ${q}` })
      .where(
        and(
          eq(inventoryTable.variantId, variant.id),
          eq(inventoryTable.locationId, locationId),
        ),
      );
  }

  return {
    accountId: account.id,
    staffId: staff.id,
    orderId: order.id,
    paymentId: payment.id,
    itemId: item.id,
    variantId: variant.id,
    locA: locA.id,
    locB: locB.id,
    priceCents,
    qty,
    totalCents: priceCents * qty,
  };
}

const paymentsFor = (orderId: number) =>
  db
    .select()
    .from(orderPaymentsTable)
    .where(eq(orderPaymentsTable.orderId, orderId))
    .orderBy(orderPaymentsTable.id);

const eventsFor = (orderId: number) =>
  db
    .select()
    .from(orderEventsTable)
    .where(eq(orderEventsTable.orderId, orderId))
    .orderBy(orderEventsTable.id);

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

describe('resolveRestockTargets', () => {
  it('returns the sold-from locations, largest draw first', async () => {
    const s = await seedPaidOrder(({ a, b }) => [
      [a, 1],
      [b, 3],
    ]);

    const lines = await db.transaction((tx) =>
      resolveRestockTargets(tx, { orderItemId: s.itemId, quantity: 4 }),
    );

    expect(lines).toEqual([
      {
        orderItemId: s.itemId,
        variantId: s.variantId,
        locationId: s.locB,
        quantity: 3,
      },
      {
        orderItemId: s.itemId,
        variantId: s.variantId,
        locationId: s.locA,
        quantity: 1,
      },
    ]);
  });

  it('caps each location at what was sold and only returns the asked quantity', async () => {
    const s = await seedPaidOrder(({ a, b }) => [
      [a, 1],
      [b, 3],
    ]);

    const lines = await db.transaction((tx) =>
      resolveRestockTargets(tx, { orderItemId: s.itemId, quantity: 2 }),
    );

    expect(lines).toEqual([
      {
        orderItemId: s.itemId,
        variantId: s.variantId,
        locationId: s.locB,
        quantity: 2,
      },
    ]);
  });
});

describe('recordRefund', () => {
  it('full refund: negative row + restock + status refunded + one refund event', async () => {
    const s = await seedPaidOrder(({ a }) => [[a, 2]]);

    const result = await db.transaction(async (tx) => {
      const restockLines = await resolveRestockTargets(tx, {
        orderItemId: s.itemId,
        quantity: s.qty,
      });
      return recordRefund(tx, {
        orderId: s.orderId,
        parentPaymentId: s.paymentId,
        grossAmountCents: s.totalCents,
        stripeRefundId: 're_test_1',
        reason: 'customer return',
        restockLines,
        eventLines: [{ orderItemId: s.itemId, quantity: s.qty }],
        actorType: 'staff',
        actorUserId: s.staffId,
      });
    });

    expect(result).toMatchObject({ netCollectedCents: 0, status: 'refunded' });

    const payments = await paymentsFor(s.orderId);
    expect(payments).toHaveLength(2);
    expect(payments[1]).toMatchObject({
      method: 'stripe',
      amountCents: -s.totalCents,
      stripeRefundId: 're_test_1',
      reason: 'customer return',
      parentPaymentId: s.paymentId,
    });

    expect(await statusOf(s.orderId)).toBe('refunded');
    expect(await stockAt(s.variantId, s.locA)).toBe(START_STOCK);

    const returns = await db
      .select()
      .from(inventoryMovementsTable)
      .where(eq(inventoryMovementsTable.reason, 'return'));
    expect(returns).toMatchObject([
      { orderItemId: s.itemId, locationId: s.locA, delta: 2, reason: 'return' },
    ]);

    const events = await eventsFor(s.orderId);
    expect(events.map((e) => e.type)).toEqual(['status_changed', 'refund']);
    expect(events[1]).toMatchObject({
      type: 'refund',
      data: {
        grossAmountCents: s.totalCents,
        stripeRefundId: 're_test_1',
        lines: [{ orderItemId: s.itemId, quantity: 2 }],
      },
      actorType: 'staff',
      actorUserId: s.staffId,
    });
  });

  it('two partial refunds: partially_refunded, then refunded on the balance', async () => {
    const s = await seedPaidOrder(({ a }) => [[a, 4]]); // total 20000

    const first = await db.transaction((tx) =>
      recordRefund(tx, {
        orderId: s.orderId,
        parentPaymentId: s.paymentId,
        grossAmountCents: 8000,
        stripeRefundId: 're_p1',
        actorType: 'staff',
        actorUserId: s.staffId,
      }),
    );
    expect(first).toMatchObject({
      netCollectedCents: s.totalCents - 8000,
      status: 'partially_refunded',
    });
    expect(await statusOf(s.orderId)).toBe('partially_refunded');

    const second = await db.transaction((tx) =>
      recordRefund(tx, {
        orderId: s.orderId,
        parentPaymentId: s.paymentId,
        grossAmountCents: s.totalCents - 8000,
        stripeRefundId: 're_p2',
        actorType: 'staff',
        actorUserId: s.staffId,
      }),
    );
    expect(second).toMatchObject({ netCollectedCents: 0, status: 'refunded' });
    expect(await statusOf(s.orderId)).toBe('refunded');

    // one status_changed per transition + one refund event per call
    const events = await eventsFor(s.orderId);
    expect(events.map((e) => e.type)).toEqual([
      'status_changed',
      'refund',
      'status_changed',
      'refund',
    ]);
  });

  it('rolls back everything when a restock line is invalid', async () => {
    const s = await seedPaidOrder(({ a }) => [[a, 2]]);

    await expect(
      db.transaction((tx) =>
        recordRefund(tx, {
          orderId: s.orderId,
          parentPaymentId: s.paymentId,
          grossAmountCents: s.totalCents,
          stripeRefundId: 're_bad',
          restockLines: [
            {
              orderItemId: s.itemId,
              variantId: 999_999, // no such variant → FK violation
              locationId: s.locA,
              quantity: 2,
            },
          ],
          actorType: 'staff',
          actorUserId: s.staffId,
        }),
      ),
    ).rejects.toThrow();

    expect(await paymentsFor(s.orderId)).toHaveLength(1); // no refund row
    expect(await statusOf(s.orderId)).toBe('paid');
    expect(await eventsFor(s.orderId)).toHaveLength(0);
  });

  it('rejects a non-positive amount', async () => {
    const s = await seedPaidOrder(({ a }) => [[a, 1]]);
    await expect(
      db.transaction((tx) =>
        recordRefund(tx, {
          orderId: s.orderId,
          parentPaymentId: s.paymentId,
          grossAmountCents: 0,
          stripeRefundId: 're_zero',
          actorType: 'staff',
          actorUserId: s.staffId,
        }),
      ),
    ).rejects.toThrow();
  });
});
