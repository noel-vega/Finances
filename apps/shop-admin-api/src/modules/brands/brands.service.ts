import { Inject, Injectable } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { DRIZZLE } from 'src/database/database.constants';
import { brandsTable, type db as Db } from 'db';

@Injectable()
export class BrandsService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async create(createBrandDto: CreateBrandDto) {
    const [brand] = await this.db
      .insert(brandsTable)
      .values({ name: createBrandDto.name })
      .returning();
    return brand;
  }

  async findAll() {
    return await this.db.select().from(brandsTable);
  }
}
