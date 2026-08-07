import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { accountsTable } from "./accounts.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

export const accountApiKeysTable = pgTable("account_api_keys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  // Looked up per-request by exact match, so stored as plaintext (like a
  // Stripe publishable key) rather than hashed like a password — it
  // identifies a tenant, it isn't a secret credential on its own.
  key: text("key").notNull().unique(),
  label: text("label"),
  createdAt: timestampAt("created_at"),
  updatedAt: timestampAt("updated_at"),
  revokedAt: timestamp("revoked_at"),
});

export const SelectAccountApiKeySchema = createSelectSchema(accountApiKeysTable);
export type SelectAccountApiKey = z.infer<typeof SelectAccountApiKeySchema>;
export const InsertAccountApiKeySchema = createInsertSchema(accountApiKeysTable);
export type InsertAccountApiKey = z.infer<typeof InsertAccountApiKeySchema>;
