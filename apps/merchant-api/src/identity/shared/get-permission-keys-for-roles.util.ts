import {
  type db as Db,
  eq,
  inArray,
  permissionsTable,
  rolePermissionsTable,
} from 'db/identity';

type Queryable = Pick<typeof Db, 'select' | 'selectDistinct'>;

export async function getPermissionKeysForRoles(
  tx: Queryable,
  roleIds: number[],
): Promise<string[]> {
  if (roleIds.length === 0) return [];

  const rows = await tx
    .selectDistinct({ key: permissionsTable.key })
    .from(rolePermissionsTable)
    .innerJoin(
      permissionsTable,
      eq(permissionsTable.id, rolePermissionsTable.permissionId),
    )
    .where(inArray(rolePermissionsTable.roleId, roleIds));

  return rows.map((row) => row.key);
}
