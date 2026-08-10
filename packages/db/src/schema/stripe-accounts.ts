import { boolean, integer, pgTable, text } from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { accountsTable } from "./accounts.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

// Stripe Connect (Express) — each account collects its own payments, the
// platform never holds their money. A row only exists once an account has
// started onboarding, so "not connected" is just "no row" rather than a
// nullable stripeAccountId + meaningless default-false flags on accountsTable
export const stripeAccountsTable = pgTable("stripe_accounts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .unique()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  stripeAccountId: text("stripe_account_id").notNull().unique(),
  chargesEnabled: boolean("charges_enabled").notNull().default(false),
  detailsSubmitted: boolean("details_submitted").notNull().default(false),
  createdAt: timestampAt("created_at"),
  updatedAt: timestampAt("updated_at"),
});

export const SelectStripeAccountSchema = createSelectSchema(stripeAccountsTable);
export type SelectStripeAccount = z.infer<typeof SelectStripeAccountSchema>;
export const InsertStripeAccountSchema = createInsertSchema(stripeAccountsTable);
export type InsertStripeAccount = z.infer<typeof InsertStripeAccountSchema>;
