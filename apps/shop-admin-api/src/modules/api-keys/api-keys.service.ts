import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.constants';
import { accountApiKeysTable, and, eq, isNull, type db as Db } from 'db';

@Injectable()
export class ApiKeysService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async listForAccount(accountId: number) {
    return this.db
      .select({
        id: accountApiKeysTable.id,
        key: accountApiKeysTable.key,
        label: accountApiKeysTable.label,
        createdAt: accountApiKeysTable.createdAt,
      })
      .from(accountApiKeysTable)
      .where(
        and(
          eq(accountApiKeysTable.accountId, accountId),
          isNull(accountApiKeysTable.revokedAt),
        ),
      );
  }
}
