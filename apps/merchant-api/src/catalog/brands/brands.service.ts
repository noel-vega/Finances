import { Inject, Injectable } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { DRIZZLE } from 'src/shared/database/database.constants';
import { brandsTable, type db as Db, eq } from 'db/catalog';

@Injectable()
export class BrandsService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async create(createBrandDto: CreateBrandDto, accountId: number) {
    const [brand] = await this.db
      .insert(brandsTable)
      .values({ name: createBrandDto.name, accountId })
      .returning();
    return brand;
  }

  async findAll(accountId: number) {
    return await this.db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.accountId, accountId));
  }
}
