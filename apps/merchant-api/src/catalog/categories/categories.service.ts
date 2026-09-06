import { Inject, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { DRIZZLE } from 'src/shared/database/database.constants';
import { categoriesTable, type db as Db, eq } from 'db/catalog';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async create(createCategoryDto: CreateCategoryDto, accountId: number) {
    const [category] = await this.db
      .insert(categoriesTable)
      .values({ name: createCategoryDto.name, accountId })
      .returning();
    return category;
  }

  async findAll(accountId: number) {
    return await this.db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.accountId, accountId));
  }
}
