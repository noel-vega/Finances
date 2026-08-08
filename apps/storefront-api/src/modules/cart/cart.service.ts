import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DRIZZLE } from '../../database/database.constants';
import {
  and,
  cartItemsTable,
  cartsTable,
  eq,
  inArray,
  inventoryTable,
  productOptionsTable,
  productOptionValuesTable,
  productsTable,
  productVariantsTable,
  sql,
  variantOptionValuesTable,
  type SelectCart,
  type db as Db,
} from 'db';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async addItem(
    cartToken: string | undefined,
    accountId: number,
    dto: AddCartItemDto,
  ): Promise<Cart> {
    const quantity = dto.quantity ?? 1;

    // only variants belonging to an active product in this tenant can be added
    const [variant] = await this.db
      .select({ id: productVariantsTable.id })
      .from(productVariantsTable)
      .innerJoin(
        productsTable,
        eq(productsTable.id, productVariantsTable.productId),
      )
      .where(
        and(
          eq(productVariantsTable.id, dto.variantId),
          eq(productsTable.accountId, accountId),
          eq(productsTable.status, 'active'),
        ),
      );
    if (!variant) {
      throw new BadRequestException('Variant not found');
    }

    const cart = await this.findOrCreateCart(cartToken, accountId);

    await this.db
      .insert(cartItemsTable)
      .values({ cartId: cart.id, variantId: dto.variantId, quantity })
      .onConflictDoUpdate({
        target: [cartItemsTable.cartId, cartItemsTable.variantId],
        set: { quantity: sql`${cartItemsTable.quantity} + ${quantity}` },
      });

    return this.buildCart(cart);
  }

  async getCart(
    cartToken: string | undefined,
    accountId: number,
  ): Promise<Cart | undefined> {
    const cart = await this.findCart(cartToken, accountId);
    if (!cart) return undefined;
    return this.buildCart(cart);
  }

  async updateItem(
    cartToken: string | undefined,
    accountId: number,
    variantId: number,
    dto: UpdateCartItemDto,
  ): Promise<Cart | undefined> {
    const cart = await this.findCart(cartToken, accountId);
    if (!cart) return undefined;

    const [updated] = await this.db
      .update(cartItemsTable)
      .set({ quantity: dto.quantity })
      .where(
        and(
          eq(cartItemsTable.cartId, cart.id),
          eq(cartItemsTable.variantId, variantId),
        ),
      )
      .returning();
    if (!updated) return undefined;

    return this.buildCart(cart);
  }

  async removeItem(
    cartToken: string | undefined,
    accountId: number,
    variantId: number,
  ): Promise<Cart | undefined> {
    const cart = await this.findCart(cartToken, accountId);
    if (!cart) return undefined;

    const [deleted] = await this.db
      .delete(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.cartId, cart.id),
          eq(cartItemsTable.variantId, variantId),
        ),
      )
      .returning();
    if (!deleted) return undefined;

    return this.buildCart(cart);
  }

  async clear(
    cartToken: string | undefined,
    accountId: number,
  ): Promise<Cart | undefined> {
    const cart = await this.findCart(cartToken, accountId);
    if (!cart) return undefined;

    await this.db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));

    return this.buildCart(cart);
  }

  private async findCart(cartToken: string | undefined, accountId: number) {
    if (!cartToken) return undefined;

    const [cart] = await this.db
      .select()
      .from(cartsTable)
      .where(
        and(eq(cartsTable.token, cartToken), eq(cartsTable.accountId, accountId)),
      );
    return cart;
  }

  private async findOrCreateCart(cartToken: string | undefined, accountId: number) {
    const existing = await this.findCart(cartToken, accountId);
    if (existing) return existing;

    const [cart] = await this.db
      .insert(cartsTable)
      .values({ accountId, token: randomUUID() })
      .returning();
    return cart;
  }

  private async buildCart(cart: SelectCart): Promise<Cart> {
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
      .innerJoin(productsTable, eq(productsTable.id, productVariantsTable.productId))
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

    return { token: cart.token, items, subtotalCents, itemCount };
  }

  private async attachOptionValues<T extends { variantId: number }>(
    rows: T[],
  ): Promise<(T & { optionValues: { optionName: string; value: string }[] })[]> {
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

    const byVariant = new Map<number, { optionName: string; value: string }[]>();
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
