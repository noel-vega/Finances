import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { accountsTable } from "./accounts.js";
import { locationsTable } from "./inventory.js";
import { usersTable } from "./users.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

// A physical POS device (tablet/phone) paired to one account and one
// location. Staff mint a device from the admin dashboard, which hands back a
// short-lived `pairingCode`; the device redeems that code once for the
// long-lived `token` it then sends on every request (x-pos-device-token).
// Like account_api_keys the token is stored plaintext and looked up by exact
// match — it identifies a device, and can be revoked without touching the
// staff user's own credentials.
export const posDevicesTable = pgTable("pos_devices", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  // the store this device sells from — restrict rather than cascade so a
  // location that still has a device bound to it can't be deleted out from
  // under it
  locationId: integer()
    .notNull()
    .references(() => locationsTable.id, { onDelete: "restrict" }),
  name: varchar({ length: 255 }).notNull(),
  // null until the device redeems its pairing code
  token: varchar({ length: 64 }).unique(),
  // short code typed into the device once to pair it; nulled on redemption
  pairingCode: varchar("pairing_code", { length: 12 }),
  pairingExpiresAt: timestamp("pairing_expires_at"),
  pairedAt: timestamp("paired_at"),
  lastSeenAt: timestamp("last_seen_at"),
  revokedAt: timestamp("revoked_at"),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestampAt("created_at"),
  updatedAt: timestampAt("updated_at"),
});

export const SelectPosDeviceSchema = createSelectSchema(posDevicesTable);
export type SelectPosDevice = z.infer<typeof SelectPosDeviceSchema>;
export const InsertPosDeviceSchema = createInsertSchema(posDevicesTable);
export type InsertPosDevice = z.infer<typeof InsertPosDeviceSchema>;
