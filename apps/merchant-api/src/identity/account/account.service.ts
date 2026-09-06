import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from 'src/shared/database/database.constants';
import { accountsTable, type db as Db, eq } from 'db/identity';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async findOne(accountId: number) {
    const [account] = await this.db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId));
    if (!account) throw new NotFoundException();
    return account;
  }

  async update(accountId: number, dto: UpdateAccountDto) {
    const [account] = await this.db
      .update(accountsTable)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(accountsTable.id, accountId))
      .returning();
    if (!account) throw new NotFoundException();
    return account;
  }
}
