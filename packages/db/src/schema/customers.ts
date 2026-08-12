import { integer, pgTable, text, unique, varchar } from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { accountsTable } from "./accounts.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

// unique on (accountId, email), not email alone like usersTable — a shopper
// can have separate accounts at different merchants built on this platform,
// so identity is scoped to the tenant, not global
export const customersTable = pgTable(
  "customers",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    accountId: integer()
      .notNull()
      .references(() => accountsTable.id, { onDelete: "cascade" }),
    firstname: text("first_name").notNull(),
    lastname: text("last_name").notNull(),
    email: varchar({ length: 255 }).notNull(),
    password: varchar({ length: 255 }).notNull(),
    createdAt: timestampAt("created_at"),
    updatedAt: timestampAt("updated_at"),
  },
  (t) => [unique().on(t.accountId, t.email)],
);

export const SelectCustomerSchema = createSelectSchema(customersTable);
export type SelectCustomer = z.infer<typeof SelectCustomerSchema>;
export const InsertCustomerSchema = createInsertSchema(customersTable);
export type InsertCustomer = z.infer<typeof InsertCustomerSchema>;
