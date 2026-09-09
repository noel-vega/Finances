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
  orderItemsTable,
  orderPaymentsTable,
  ordersTable,
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

@Injectable()
export class RefundsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: typeof Db,
    @Inject(PAYMENTS_PORT) private readonly payments: PaymentsPort,
  ) {}

  // Full refund of a web order via the Stripe connected account. Partial /
  // line-item refunds are OS-122.
  async refundOrder(
    orderId: number,
    accountId: number,
    dto: RefundOrderDto,
    actorUserId: number,
  ): Promise<OrderRefund> {
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

    // Stripe first, then the DB write below. If the DB write fails after Stripe
    // succeeds, the `charge.refunded` webhook (OS-127) reconciles the missing
    // row. The idempotency key means a double-submit re-hits Stripe's existing
    // refund rather than issuing a second one.
    const { stripeRefundId } = await this.payments.refundPaymentIntent({
      accountId: order.accountId,
      paymentIntentId: tender.stripePaymentIntentId,
      amountCents: netCollectedCents,
      idempotencyKey: `refund-order-${orderId}-full`,
    });

    const restock = dto.restock ?? true;

    return this.db.transaction(async (tx) => {
      const items = await tx
        .select({
          id: orderItemsTable.id,
          quantity: orderItemsTable.quantity,
        })
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, orderId));

      let restockLines: RestockLine[] = [];
      if (restock) {
        for (const item of items) {
          restockLines = restockLines.concat(
            await resolveRestockTargets(tx, {
              orderItemId: item.id,
              quantity: item.quantity,
            }),
          );
        }
      }

      const result = await recordRefund(tx, {
        orderId,
        parentPaymentId: tender.id,
        grossAmountCents: netCollectedCents,
        stripeRefundId,
        reason: dto.reason ?? null,
        restockLines,
        eventLines: items.map((i) => ({
          orderItemId: i.id,
          quantity: i.quantity,
        })),
        actorType: 'staff',
        actorUserId,
      });

      return {
        id: result.refundPaymentId,
        orderId,
        amountCents: netCollectedCents,
        stripeRefundId,
        status: result.status,
      };
    });
  }
}
