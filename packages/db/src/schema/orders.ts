import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { accountsTable } from "./accounts.js";
import { productVariantsTable } from "./products.js";
import { locationsTable } from "./inventory.js";
import { posDevicesTable } from "./pos-devices.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

// how a sale was made — 'web' is a storefront checkout (Stripe, ships to an
// address), 'pos' is an in-person sale rung up on a paired POS device
export const orderChannelEnum = pgEnum("order_channel", ["web", "pos"]);

// tender type on an order_payments row. 'stripe' is the storefront checkout;
// 'cash'/'card' are POS tenders — recorded, not processed.
export const orderPaymentMethodEnum = pgEnum("order_payment_method", [
  "stripe",
  "cash",
  "card",
]);

// a completed sale. 'web' rows are created by the checkout webhook once
// Stripe confirms payment; 'pos' rows are created synchronously by pos-api
// when a cashier completes a sale. Channel-specific data lives in
// order_shipping (web ship-to address) and order_payments (all channels).
export const ordersTable = pgTable("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  channel: orderChannelEnum().notNull().default("web"),
  // the physical location a POS sale happened at — null for web orders.
  // distinct from order_shipping.locationId (a checkout-time ship-from rate
  // estimate) and fulfillments.locationId (where a label actually shipped from)
  locationId: integer().references(() => locationsTable.id, {
    onDelete: "set null",
  }),
  posDeviceId: integer().references(() => posDevicesTable.id, {
    onDelete: "set null",
  }),
  // null for POS walk-in sales; the guest's details for a web order
  customerEmail: text(),
  customerName: text(),
  subtotalCents: integer().notNull(),
  // reserved for future tax collection — always 0 today
  taxCents: integer().notNull().default(0),
  // from Stripe's shipping_cost.amount_total at checkout time; 0 for POS
  shippingCents: integer().notNull().default(0),
  // the actual amount charged / total collected
  amountTotalCents: integer().notNull(),
  // null until the order-confirmation email job is successfully enqueued
  // (web only) — lets the worker tell "already emailed" apart from "order
  // committed but the process died before the email went out"
  confirmationEmailQueuedAt: timestamp("confirmation_email_queued_at"),
  createdAt: timestampAt("created_at"),
  updatedAt: timestampAt("updated_at"),
});

export const SelectOrderSchema = createSelectSchema(ordersTable);
export type SelectOrder = z.infer<typeof SelectOrderSchema>;
export const InsertOrderSchema = createInsertSchema(ordersTable);
export type InsertOrder = z.infer<typeof InsertOrderSchema>;

// the ship-to address for a web order — one row per order, channel 'web'
// only. POS sales have no row here.
export const orderShippingTable = pgTable(
  "order_shipping",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer()
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" }),
    line1: text().notNull(),
    line2: text(),
    city: text().notNull(),
    state: text(),
    postalCode: text().notNull(),
    country: text().notNull(),
    // which location's address was quoted as ship-from at checkout — only a
    // rate-estimation input, independent of fulfillments.locationId
    locationId: integer().references(() => locationsTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestampAt("created_at"),
  },
  (t) => [unique().on(t.orderId)],
);

export const SelectOrderShippingSchema = createSelectSchema(orderShippingTable);
export type SelectOrderShipping = z.infer<typeof SelectOrderShippingSchema>;
export const InsertOrderShippingSchema = createInsertSchema(orderShippingTable);
export type InsertOrderShipping = z.infer<typeof InsertOrderShippingSchema>;

// one tender against an order. A web order gets a single 'stripe' row
// carrying the checkout session (still the webhook idempotency key) + payment
// intent. A POS order gets a 'cash' or 'card' row; cash also records
// amountTenderedCents so change due can be reconstructed. Modelled 1:many for
// future split tender; today every order has exactly one.
export const orderPaymentsTable = pgTable("order_payments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer()
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  method: orderPaymentMethodEnum().notNull(),
  amountCents: integer().notNull(),
  // cash tenders only — what the customer handed over (>= amountCents);
  // null for card / stripe
  amountTenderedCents: integer(),
  // Stripe checkout only — doubles as the webhook's idempotency key
  stripeCheckoutSessionId: text().unique(),
  stripePaymentIntentId: text(),
  createdAt: timestampAt("created_at"),
});

export const SelectOrderPaymentSchema = createSelectSchema(orderPaymentsTable);
export type SelectOrderPayment = z.infer<typeof SelectOrderPaymentSchema>;
export const InsertOrderPaymentSchema = createInsertSchema(orderPaymentsTable);
export type InsertOrderPayment = z.infer<typeof InsertOrderPaymentSchema>;

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
  // order_shipping.locationId's "set null" (that one's just a checkout-time
  // estimate, this one is what Shippo actually shipped from)
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
