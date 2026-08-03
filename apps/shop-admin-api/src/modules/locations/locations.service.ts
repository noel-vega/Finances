import { Inject, Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { DRIZZLE } from 'src/database/database.constants';
import { locationsTable, type db as Db } from 'db';

@Injectable()
export class LocationsService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async create(createLocationDto: CreateLocationDto) {
    const [location] = await this.db
      .insert(locationsTable)
      .values({ name: createLocationDto.name })
      .returning();
    return location;
  }

  async findAll() {
    return await this.db.select().from(locationsTable);
  }
}
