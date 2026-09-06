import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DRIZZLE } from 'src/shared/database/database.constants';
import {
  PERMISSIONS_CATALOG,
  permissionsTable,
  rolePermissionsTable,
  userRolesTable,
  eq,
  sql,
  type db as Db,
} from 'db';

@Injectable()
export class PermissionsService implements OnModuleInit {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  // seeds/updates the fixed permission catalog on every boot. Rows for keys
  // removed from PERMISSIONS_CATALOG are left in place rather than deleted,
  // so a bad deploy can't destroy role_permissions references.
  async onModuleInit() {
    if (PERMISSIONS_CATALOG.length === 0) return;

    await this.db
      .insert(permissionsTable)
      .values(PERMISSIONS_CATALOG)
      .onConflictDoUpdate({
        target: permissionsTable.key,
        set: {
          resource: sql`excluded.resource`,
          action: sql`excluded.action`,
          description: sql`excluded.description`,
        },
      });
  }

  async findAll() {
    return await this.db
      .select()
      .from(permissionsTable)
      .orderBy(permissionsTable.resource, permissionsTable.action);
  }

  // the guard's core query: every permission key granted to a user through
  // any role they hold. Live DB lookup, not cached — see the RBAC plan for
  // why (stale embedded permissions would delay revoking a fired staffer).
  async getEffectivePermissionKeys(userId: number): Promise<Set<string>> {
    const rows = await this.db
      .selectDistinct({ key: permissionsTable.key })
      .from(userRolesTable)
      .innerJoin(
        rolePermissionsTable,
        eq(rolePermissionsTable.roleId, userRolesTable.roleId),
      )
      .innerJoin(
        permissionsTable,
        eq(permissionsTable.id, rolePermissionsTable.permissionId),
      )
      .where(eq(userRolesTable.userId, userId));

    return new Set(rows.map((row) => row.key));
  }
}
