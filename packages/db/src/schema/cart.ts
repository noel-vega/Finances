import { integer, pgTable, text, unique } from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { accountsTable } from "./accounts.js";
import { productVariantsTable } from "./products.js";
import { customersTable } from "./customers.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

export const cartsTable = pgTable("carts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  // opaque identifier handed to the client on first add-to-cart and sent
  // back as x-cart-token — still how a guest cart is identified even after
  // a customer signs in and claims it (see customerId below)
  token: text("token").notNull().unique(),
  // null for a guest cart. Set once, at signin, when the cart matching the
  // current x-cart-token is claimed by the signed-in customer.
  customerId: integer().references(() => customersTable.id, {
    onDelete: "set null",
  }),
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
