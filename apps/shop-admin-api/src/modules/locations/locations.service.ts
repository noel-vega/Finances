import { Inject, Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { DRIZZLE } from 'src/database/database.constants';
import { locationsTable, and, eq, type db as Db } from 'db';

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

  async update(id: number, updateLocationDto: UpdateLocationDto, accountId: number) {
    const [location] = await this.db
      .update(locationsTable)
      .set({ ...updateLocationDto, updatedAt: new Date() })
      .where(and(eq(locationsTable.id, id), eq(locationsTable.accountId, accountId)))
      .returning();
    return location;
  }
}
