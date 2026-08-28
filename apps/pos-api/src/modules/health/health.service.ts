import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { sql, type db as Db } from 'db';
import { DRIZZLE } from '../../database/database.constants';

@Injectable()
export class HealthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: typeof Db,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  checkDatabase = async () => {
    const indicator = this.healthIndicatorService.check('database');
    try {
      await this.db.execute(sql`select 1`);
      return indicator.up();
    } catch (err) {
      return indicator.down({
        message: err instanceof Error ? err.message : 'unknown error',
      });
    }
  };
}
