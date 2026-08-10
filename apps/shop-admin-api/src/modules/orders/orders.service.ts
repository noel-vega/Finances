import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.constants';
import {
  and,
  desc,
  eq,
  orderItemsTable,
  ordersTable,
  sql,
  type db as Db,
} from 'db';
import { PaginatedOrders } from './entities/paginated-orders.entity';
import { OrderDetail } from './entities/order-detail.entity';

const MAX_LIMIT = 100;

@Injectable()
export class OrdersService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async findAll(
    limit: number,
    offset: number,
    accountId: number,
  ): Promise<PaginatedOrders> {
    const clampedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
    const clampedOffset = Math.max(offset, 0);

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: ordersTable.id,
          customerName: ordersTable.customerName,
          customerEmail: ordersTable.customerEmail,
          amountTotalCents: ordersTable.amountTotalCents,
          createdAt: ordersTable.createdAt,
          itemCount: sql<number>`coalesce(sum(${orderItemsTable.quantity}), 0)::int`,
        })
        .from(ordersTable)
        .leftJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
        .where(eq(ordersTable.accountId, accountId))
        .groupBy(ordersTable.id)
        .orderBy(desc(ordersTable.createdAt))
        .limit(clampedLimit)
        .offset(clampedOffset),
      this.db
        .select({ total: sql<number>`count(*)::int` })
        .from(ordersTable)
        .where(eq(ordersTable.accountId, accountId)),
    ]);

    return { items, total, limit: clampedLimit, offset: clampedOffset };
  }

  async findOne(id: number, accountId: number): Promise<OrderDetail | undefined> {
    const [order] = await this.db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, id), eq(ordersTable.accountId, accountId)));
    if (!order) return undefined;

    const items = await this.db
      .select({
        id: orderItemsTable.id,
        variantId: orderItemsTable.variantId,
        productName: orderItemsTable.productName,
        sku: orderItemsTable.sku,
        optionsLabel: orderItemsTable.optionsLabel,
        priceCents: orderItemsTable.priceCents,
        quantity: orderItemsTable.quantity,
      })
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));

    return {
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingLine1: order.shippingLine1,
      shippingLine2: order.shippingLine2,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPostalCode: order.shippingPostalCode,
      shippingCountry: order.shippingCountry,
      subtotalCents: order.subtotalCents,
      amountTotalCents: order.amountTotalCents,
      createdAt: order.createdAt,
      items,
    };
  }
}
