import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { usersTable } from "./users.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

// a user has at most one active invite at a time — a row only exists while
// an invite is pending, same reasoning as stripe_accounts: "no pending
// invite" is just "no row" rather than nullable token/expiry columns on
// usersTable. Consumed (deleted) once the user sets their password.
export const userInvitesTable = pgTable("user_invites", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: varchar({ length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestampAt("created_at"),
});

export const SelectUserInviteSchema = createSelectSchema(userInvitesTable);
export type SelectUserInvite = z.infer<typeof SelectUserInviteSchema>;
export const InsertUserInviteSchema = createInsertSchema(userInvitesTable);
export type InsertUserInvite = z.infer<typeof InsertUserInviteSchema>;
