import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  type db as Db,
  eq,
  orderItemsTable,
  orderPaymentsTable,
  orderRefundLinesTable,
  ordersTable,
  sql,
} from 'db/sales';
import { DRIZZLE } from 'src/shared/database/database.constants';
import { OrderRefund } from './entities/order-refund.entity';
import { RefundOrderDto } from './dto/refund-order.dto';
import { PAYMENTS_PORT, type PaymentsPort } from './ports/payments.port';
import {
  recordRefund,
  resolveRestockTargets,
  type RestockLine,
} from './refunds';

type Executor = Pick<typeof Db, 'select'>;

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

@Injectable()
export class RefundsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: typeof Db,
    @Inject(PAYMENTS_PORT) private readonly payments: PaymentsPort,
  ) {}

  // Refund a web order — full (OS-121), an ad-hoc amount, or specific line
  // items. At most one of dto.amountCents / dto.lines.
  async refundOrder(
    orderId: number,
    accountId: number,
    dto: RefundOrderDto,
    actorUserId: number,
  ): Promise<OrderRefund> {
    const wantsAmount = dto.amountCents != null;
    const wantsLines = dto.lines != null && dto.lines.length > 0;
    if (wantsAmount && wantsLines) {
      throw new BadRequestException('Provide amountCents or lines, not both');
    }

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

    if (order.channel !== 'web') {
      throw new ConflictException(
        'Only web orders can be refunded through Stripe',
      );
    }
    if (order.status !== 'paid' && order.status !== 'partially_refunded') {
      throw new ConflictException(
        `Cannot refund an order in status '${order.status}'`,
      );
    }

    const payments = await this.db
      .select()
      .from(orderPaymentsTable)
      .where(eq(orderPaymentsTable.orderId, orderId));

    const tender = payments.find(
      (p) =>
        p.method === 'stripe' && p.stripePaymentIntentId && p.amountCents > 0,
    );
    if (!tender?.stripePaymentIntentId) {
      throw new ConflictException('No Stripe payment on this order');
    }

    const netCollectedCents = payments.reduce((n, p) => n + p.amountCents, 0);
    if (netCollectedCents <= 0) {
      throw new ConflictException('Order is already fully refunded');
    }

    const items = await this.db
      .select({
        id: orderItemsTable.id,
        priceCents: orderItemsTable.priceCents,
        quantity: orderItemsTable.quantity,
      })
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId));
    const itemById = new Map(items.map((i) => [i.id, i]));

    let grossAmountCents: number;
    let restockRequest: { orderItemId: number; quantity: number }[];
    let refundLineRecords: { orderItemId: number; quantity: number }[];
    // what the `refund` audit event records as covered (data.lines)
    let eventLines: { orderItemId: number; quantity: number }[];
    const restock = dto.restock ?? true;

    if (wantsLines) {
      const priorByItem = await this.refundedQtyByItem(this.db, orderId);
      grossAmountCents = 0;
      for (const line of dto.lines!) {
        const item = itemById.get(line.orderItemId);
        if (!item) {
          throw new ConflictException(
            `Order item ${line.orderItemId} is not on this order`,
          );
        }
        const stillRefundable =
          item.quantity - (priorByItem.get(line.orderItemId) ?? 0);
        if (line.quantity > stillRefundable) {
          throw new ConflictException(
            `Only ${stillRefundable} unit(s) of order item ${line.orderItemId} can still be refunded`,
          );
        }
        grossAmountCents += line.quantity * item.priceCents;
      }
      refundLineRecords = dto.lines!.map((l) => ({
        orderItemId: l.orderItemId,
        quantity: l.quantity,
      }));
      restockRequest = restock ? refundLineRecords : [];
      eventLines = refundLineRecords;
    } else if (wantsAmount) {
      grossAmountCents = dto.amountCents!;
      restockRequest = [];
      refundLineRecords = [];
      eventLines = [];
    } else {
      grossAmountCents = netCollectedCents;
      const allItems = items.map((i) => ({
        orderItemId: i.id,
        quantity: i.quantity,
      }));
      restockRequest = restock ? allItems : [];
      refundLineRecords = [];
      eventLines = allItems;
    }

    if (grossAmountCents > netCollectedCents) {
      throw new ConflictException(
        `Refund of ${fmt(grossAmountCents)} exceeds the ${fmt(netCollectedCents)} still refundable on this order`,
      );
    }

    const priorRefundCount = payments.filter((p) => p.amountCents < 0).length;
    const idempotencyKey =
      !wantsAmount && !wantsLines
        ? `refund-order-${orderId}-full`
        : `refund-order-${orderId}-p${priorRefundCount}`;

    // Stripe first, then the DB write. A DB failure after Stripe succeeds is
    // reconciled by the charge.refunded webhook (OS-127); the idempotency key
    // makes a re-submit of the same request re-hit Stripe's existing refund.
    const { stripeRefundId } = await this.payments.refundPaymentIntent({
      accountId: order.accountId,
      paymentIntentId: tender.stripePaymentIntentId,
      amountCents: grossAmountCents,
      idempotencyKey,
    });

    return this.db.transaction(async (tx) => {
      let restockLines: RestockLine[] = [];
      for (const r of restockRequest) {
        restockLines = restockLines.concat(
          await resolveRestockTargets(tx, {
            orderItemId: r.orderItemId,
            quantity: r.quantity,
          }),
        );
      }

      const result = await recordRefund(tx, {
        orderId,
        parentPaymentId: tender.id,
        grossAmountCents,
        stripeRefundId,
        reason: dto.reason ?? null,
        restockLines,
        eventLines,
        actorType: 'staff',
        actorUserId,
      });

      if (refundLineRecords.length > 0) {
        await tx.insert(orderRefundLinesTable).values(
          refundLineRecords.map((r) => ({
            refundPaymentId: result.refundPaymentId,
            orderItemId: r.orderItemId,
            quantity: r.quantity,
          })),
        );
      }

      return {
        id: result.refundPaymentId,
        orderId,
        amountCents: grossAmountCents,
        stripeRefundId,
        status: result.status,
      };
    });
  }

  // units already refunded per order item, across every prior line-item refund
  private async refundedQtyByItem(
    executor: Executor,
    orderId: number,
  ): Promise<Map<number, number>> {
    const rows = await executor
      .select({
        orderItemId: orderRefundLinesTable.orderItemId,
        qty: sql<number>`coalesce(sum(${orderRefundLinesTable.quantity}), 0)::int`,
      })
      .from(orderRefundLinesTable)
      .innerJoin(
        orderPaymentsTable,
        eq(orderPaymentsTable.id, orderRefundLinesTable.refundPaymentId),
      )
      .where(eq(orderPaymentsTable.orderId, orderId))
      .groupBy(orderRefundLinesTable.orderItemId);
    return new Map(rows.map((r) => [r.orderItemId, r.qty]));
  }
}
