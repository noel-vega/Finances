import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.constants';
import {
  accountApiKeysTable,
  and,
  eq,
  isNull,
  usersTable,
  type db as Db,
} from 'db';

@Injectable()
export class ApiKeysService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async listForUser(userId: number) {
    return this.db
      .select({
        id: accountApiKeysTable.id,
        key: accountApiKeysTable.key,
        label: accountApiKeysTable.label,
        createdAt: accountApiKeysTable.createdAt,
      })
      .from(accountApiKeysTable)
      .innerJoin(
        usersTable,
        eq(usersTable.accountId, accountApiKeysTable.accountId),
      )
      .where(
        and(eq(usersTable.id, userId), isNull(accountApiKeysTable.revokedAt)),
      );
  }
}
