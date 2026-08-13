import { boolean, integer, pgTable, primaryKey, unique, varchar } from "drizzle-orm/pg-core";
import { timestampAt } from "../utils.js";
import { accountsTable } from "./accounts.js";
import { usersTable } from "./users.js";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import z from "zod";

// fixed, code-defined catalog — no accountId, rows are never created via the API,
// only upserted at boot from packages/db/src/permissions-catalog.ts
export const permissionsTable = pgTable("permissions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  key: varchar({ length: 100 }).notNull().unique(),
  resource: varchar({ length: 50 }).notNull(),
  action: varchar({ length: 50 }).notNull(),
  description: varchar({ length: 255 }).notNull(),
  createdAt: timestampAt("created_at"),
});

export const SelectPermissionSchema = createSelectSchema(permissionsTable);
export type SelectPermission = z.infer<typeof SelectPermissionSchema>;
export const InsertPermissionSchema = createInsertSchema(permissionsTable);
export type InsertPermission = z.infer<typeof InsertPermissionSchema>;

// named, per-account bundles of permissions that owners/admins create
export const rolesTable = pgTable(
  "roles",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    accountId: integer()
      .notNull()
      .references(() => accountsTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 100 }).notNull(),
    description: varchar({ length: 255 }),
    // the role seeded at signup with every permission — can't be edited or
    // deleted, guarantees an account never loses a role that can manage everything
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestampAt("created_at"),
    updatedAt: timestampAt("updated_at"),
  },
  (t) => [unique().on(t.accountId, t.name)],
);

export const SelectRoleSchema = createSelectSchema(rolesTable);
export type SelectRole = z.infer<typeof SelectRoleSchema>;
export const InsertRoleSchema = createInsertSchema(rolesTable);
export type InsertRole = z.infer<typeof InsertRoleSchema>;

// join table: which permissions make up a given role
export const rolePermissionsTable = pgTable(
  "role_permissions",
  {
    roleId: integer()
      .notNull()
      .references(() => rolesTable.id, { onDelete: "cascade" }),
    permissionId: integer()
      .notNull()
      .references(() => permissionsTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

// join table: which roles a given user holds (many-to-many)
export const userRolesTable = pgTable(
  "user_roles",
  {
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    roleId: integer()
      .notNull()
      .references(() => rolesTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);
