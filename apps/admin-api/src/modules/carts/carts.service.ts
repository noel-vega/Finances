import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.constants';
import {
  and,
  cartItemsTable,
  cartsTable,
  desc,
  eq,
  inArray,
  inventoryTable,
  productOptionsTable,
  productOptionValuesTable,
  productsTable,
  productVariantsTable,
  sql,
  variantOptionValuesTable,
  type db as Db,
} from 'db';
import { PaginatedCarts } from './entities/paginated-carts.entity';
import { CartDetail } from './entities/cart-detail.entity';

const MAX_LIMIT = 100;

@Injectable()
export class CartsService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  // carts with no items aren't meaningful to a merchant — the inner join
  // to cart_items drops them without needing a HAVING clause
  async findAll(
    limit: number,
    offset: number,
    accountId: number,
  ): Promise<PaginatedCarts> {
    const clampedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
    const clampedOffset = Math.max(offset, 0);

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: cartsTable.id,
          token: cartsTable.token,
          createdAt: cartsTable.createdAt,
          updatedAt: cartsTable.updatedAt,
          itemCount: sql<number>`coalesce(sum(${cartItemsTable.quantity}), 0)::int`,
          subtotalCents: sql<number>`coalesce(sum(${cartItemsTable.quantity} * ${productVariantsTable.priceCents}), 0)::int`,
        })
        .from(cartsTable)
        .innerJoin(cartItemsTable, eq(cartItemsTable.cartId, cartsTable.id))
        .innerJoin(
          productVariantsTable,
          eq(productVariantsTable.id, cartItemsTable.variantId),
        )
        .where(eq(cartsTable.accountId, accountId))
        .groupBy(cartsTable.id)
        .orderBy(desc(cartsTable.updatedAt))
        .limit(clampedLimit)
        .offset(clampedOffset),
      this.db
        .select({ total: sql<number>`count(distinct ${cartsTable.id})::int` })
        .from(cartsTable)
        .innerJoin(cartItemsTable, eq(cartItemsTable.cartId, cartsTable.id))
        .where(eq(cartsTable.accountId, accountId)),
    ]);

    return { items, total, limit: clampedLimit, offset: clampedOffset };
  }

  async findOne(
    id: number,
    accountId: number,
  ): Promise<CartDetail | undefined> {
    const [cart] = await this.db
      .select()
      .from(cartsTable)
      .where(and(eq(cartsTable.id, id), eq(cartsTable.accountId, accountId)));
    if (!cart) return undefined;

    const rows = await this.db
      .select({
        variantId: cartItemsTable.variantId,
        quantity: cartItemsTable.quantity,
        productId: productsTable.id,
        productName: productsTable.name,
        sku: productVariantsTable.sku,
        priceCents: productVariantsTable.priceCents,
        stock: sql<number>`coalesce(sum(${inventoryTable.stock}), 0)::int`,
      })
      .from(cartItemsTable)
      .innerJoin(
        productVariantsTable,
        eq(productVariantsTable.id, cartItemsTable.variantId),
      )
      .innerJoin(
        productsTable,
        eq(productsTable.id, productVariantsTable.productId),
      )
      .leftJoin(
        inventoryTable,
        eq(inventoryTable.variantId, productVariantsTable.id),
      )
      .where(eq(cartItemsTable.cartId, cart.id))
      .groupBy(
        cartItemsTable.variantId,
        cartItemsTable.quantity,
        productsTable.id,
        productVariantsTable.id,
      );

    const items = await this.attachOptionValues(rows);

    const subtotalCents = items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0,
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cart.id,
      token: cart.token,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items,
      subtotalCents,
      itemCount,
    };
  }

  private async attachOptionValues<T extends { variantId: number }>(
    rows: T[],
  ): Promise<
    (T & { optionValues: { optionName: string; value: string }[] })[]
  > {
    if (rows.length === 0) return [];

    const optionRows = await this.db
      .select({
        variantId: variantOptionValuesTable.variantId,
        optionName: productOptionsTable.name,
        value: productOptionValuesTable.value,
      })
      .from(variantOptionValuesTable)
      .innerJoin(
        productOptionValuesTable,
        eq(productOptionValuesTable.id, variantOptionValuesTable.optionValueId),
      )
      .innerJoin(
        productOptionsTable,
        eq(productOptionsTable.id, productOptionValuesTable.optionId),
      )
      .where(
        inArray(
          variantOptionValuesTable.variantId,
          rows.map((r) => r.variantId),
        ),
      );

    const byVariant = new Map<
      number,
      { optionName: string; value: string }[]
    >();
    for (const row of optionRows) {
      const values = byVariant.get(row.variantId) ?? [];
      values.push({ optionName: row.optionName, value: row.value });
      byVariant.set(row.variantId, values);
    }

    return rows.map((row) => ({
      ...row,
      optionValues: byVariant.get(row.variantId) ?? [],
    }));
  }
}
