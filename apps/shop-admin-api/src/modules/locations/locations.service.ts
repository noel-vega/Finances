import { Inject, Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { DRIZZLE } from 'src/database/database.constants';
import { locationsTable, eq, type db as Db } from 'db';

@Injectable()
export class LocationsService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async create(createLocationDto: CreateLocationDto, accountId: number) {
    const [location] = await this.db
      .insert(locationsTable)
      .values({ name: createLocationDto.name, accountId })
      .returning();
    return location;
  }

  async findAll(accountId: number) {
    return await this.db
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.accountId, accountId));
  }
}
