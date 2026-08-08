import { integer, pgTable, text, unique } from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { accountsTable } from "./accounts.js";
import { productVariantsTable } from "./products.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

export const cartsTable = pgTable("carts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  // opaque, unauthenticated identifier handed to the client on first add-to-cart
  // and sent back as x-cart-token — there's no customer login yet, so this is
  // the only thing identifying "whose cart is this"
  token: text("token").notNull().unique(),
  createdAt: timestampAt("created_at"),
  updatedAt: timestampAt("updated_at"),
});

export const SelectCartSchema = createSelectSchema(cartsTable);
export type SelectCart = z.infer<typeof SelectCartSchema>;
export const InsertCartSchema = createInsertSchema(cartsTable);
export type InsertCart = z.infer<typeof InsertCartSchema>;

// price isn't stored here — it's read live off productVariantsTable when the
// cart is fetched, same as the storefront product endpoints do
export const cartItemsTable = pgTable(
  "cart_items",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    cartId: integer()
      .notNull()
      .references(() => cartsTable.id, { onDelete: "cascade" }),
    variantId: integer()
      .notNull()
      .references(() => productVariantsTable.id, { onDelete: "cascade" }),
    quantity: integer().notNull().default(1),
    createdAt: timestampAt("created_at"),
    updatedAt: timestampAt("updated_at"),
  },
  (t) => [unique().on(t.cartId, t.variantId)],
);

export const SelectCartItemSchema = createSelectSchema(cartItemsTable);
export type SelectCartItem = z.infer<typeof SelectCartItemSchema>;
export const InsertCartItemSchema = createInsertSchema(cartItemsTable);
export type InsertCartItem = z.infer<typeof InsertCartItemSchema>;
