import { Inject, Injectable } from '@nestjs/common';
import { Customer } from './entities/customer.entity';
import { DRIZZLE } from 'src/shared/database/database.constants';
import { customersTable, type db as Db, eq } from 'db/sales';

export function toCustomer(row: typeof customersTable.$inferSelect): Customer {
  return {
    id: row.id,
    accountId: row.accountId,
    firstName: row.firstname,
    lastName: row.lastname,
    email: row.email,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class CustomersService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async findAll(accountId: number): Promise<Customer[]> {
    const rows = await this.db
      .select()
      .from(customersTable)
      .where(eq(customersTable.accountId, accountId));

    return rows.map(toCustomer);
  }
}
