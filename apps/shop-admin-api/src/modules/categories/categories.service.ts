import { Inject, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { DRIZZLE } from 'src/database/database.constants';
import { categoriesTable, type db as Db } from 'db';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const [category] = await this.db
      .insert(categoriesTable)
      .values({ name: createCategoryDto.name })
      .returning();
    return category;
  }

  async findAll() {
    return await this.db.select().from(categoriesTable);
  }
}
