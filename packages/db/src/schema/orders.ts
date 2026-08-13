import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { accountsTable } from "./accounts.js";
import { productVariantsTable } from "./products.js";
import { locationsTable } from "./inventory.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

// created by the checkout webhook once Stripe confirms payment — every row
// that exists here was paid, there's no separate "paid" status to track yet.
// guest checkout only: no customer table, these fields are the only record
export const ordersTable = pgTable("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  customerEmail: text().notNull(),
  customerName: text().notNull(),
  shippingLine1: text().notNull(),
  shippingLine2: text(),
  shippingCity: text().notNull(),
  shippingState: text(),
  shippingPostalCode: text().notNull(),
  shippingCountry: text().notNull(),
  subtotalCents: integer().notNull(),
  // the actual amount charged by Stripe — kept separate from subtotalCents
  // in case shipping/tax collection is ever added on top of the line items
  amountTotalCents: integer().notNull(),
  // from Stripe's shipping_cost.amount_total at checkout time
  shippingCents: integer().notNull().default(0),
  // which location's address was quoted as ship-from at checkout — carried
  // through via the Checkout Session's metadata into the webhook. This is
  // only a rate-estimation input; it's independent of where fulfillment
  // actually ships from (see fulfillmentsTable.locationId below), since an
  // order's inventory can be allocated across more than one location.
  shippingLocationId: integer().references(() => locationsTable.id, {
    onDelete: "set null",
  }),
  // doubles as the webhook's idempotency key
  stripeCheckoutSessionId: text().notNull().unique(),
  stripePaymentIntentId: text(),
  // null until the order-confirmation email job is successfully enqueued —
  // lets the worker tell "already emailed" apart from "order committed but
  // the process died before the email went out" on a stalled-job redelivery
  confirmationEmailQueuedAt: timestamp("confirmation_email_queued_at"),
  createdAt: timestampAt("created_at"),
  updatedAt: timestampAt("updated_at"),
});

export const SelectOrderSchema = createSelectSchema(ordersTable);
export type SelectOrder = z.infer<typeof SelectOrderSchema>;
export const InsertOrderSchema = createInsertSchema(ordersTable);
export type InsertOrder = z.infer<typeof InsertOrderSchema>;

// snapshotted at order time — unlike cart_items, an order is a permanent
// record and must survive the variant/product it was placed against changing
// or being deleted later
export const orderItemsTable = pgTable("order_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer()
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  variantId: integer().references(() => productVariantsTable.id, {
    onDelete: "set null",
  }),
  productName: varchar({ length: 255 }).notNull(),
  sku: varchar({ length: 100 }),
  optionsLabel: text(),
  priceCents: integer().notNull(),
  quantity: integer().notNull(),
  // snapshotted from the variant at order time, same reasoning as
  // productName/sku above — needed later to re-quote a shipping label
  // without depending on the variant still existing
  weightOz: integer(),
  createdAt: timestampAt("created_at"),
});

export const SelectOrderItemSchema = createSelectSchema(orderItemsTable);
export type SelectOrderItem = z.infer<typeof SelectOrderItemSchema>;
export const InsertOrderItemSchema = createInsertSchema(orderItemsTable);
export type InsertOrderItem = z.infer<typeof InsertOrderItemSchema>;

// one row per label actually purchased — an order can have any number of
// these (partial shipments, or split across locations because inventory for
// the order was allocated across more than one, see inventoryMovementsTable
// .orderItemId). Unlike orderItemsTable this is never created at checkout
// time, only later via the admin fulfillment flow.
export const fulfillmentsTable = pgTable("fulfillments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer()
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  // the ship-from address actually used for this shipment — deliberately
  // not deletable out from under a purchased label's history, unlike
  // ordersTable.shippingLocationId's "set null" (that one's just a
  // checkout-time estimate, this one is what Shippo actually shipped from)
  locationId: integer()
    .notNull()
    .references(() => locationsTable.id),
  shippoTransactionId: text(),
  trackingNumber: text(),
  trackingUrl: text(),
  labelUrl: text(),
  shippingCarrier: text(),
  shippingServiceLevel: text(),
  amountCents: integer().notNull(),
  createdAt: timestampAt("created_at"),
  updatedAt: timestampAt("updated_at"),
});

export const SelectFulfillmentSchema = createSelectSchema(fulfillmentsTable);
export type SelectFulfillment = z.infer<typeof SelectFulfillmentSchema>;
export const InsertFulfillmentSchema = createInsertSchema(fulfillmentsTable);
export type InsertFulfillment = z.infer<typeof InsertFulfillmentSchema>;

// which order item(s), and how much of each, a fulfillment covers — an
// order item's quantity can be split across multiple fulfillments over time
// (e.g. some in stock now, the rest backordered and shipped later)
export const fulfillmentItemsTable = pgTable("fulfillment_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fulfillmentId: integer()
    .notNull()
    .references(() => fulfillmentsTable.id, { onDelete: "cascade" }),
  orderItemId: integer()
    .notNull()
    .references(() => orderItemsTable.id, { onDelete: "cascade" }),
  quantity: integer().notNull(),
  createdAt: timestampAt("created_at"),
});

export const SelectFulfillmentItemSchema = createSelectSchema(fulfillmentItemsTable);
export type SelectFulfillmentItem = z.infer<typeof SelectFulfillmentItemSchema>;
export const InsertFulfillmentItemSchema = createInsertSchema(fulfillmentItemsTable);
export type InsertFulfillmentItem = z.infer<typeof InsertFulfillmentItemSchema>;
