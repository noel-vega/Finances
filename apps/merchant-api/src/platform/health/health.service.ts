import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { createRedisConnection } from 'queue';
import { sql, type db as Db } from 'db';
import { DRIZZLE } from '../../shared/database/database.constants';

@Injectable()
export class HealthService {
  // its own connection, deliberately decoupled from BullMQ's — the
  // simplest way to test raw Redis reachability without reaching into
  // @nestjs/bullmq internals to reuse its connection
  private readonly redis = createRedisConnection({ commandTimeout: 2000 });

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

  checkRedis = async () => {
    const indicator = this.healthIndicatorService.check('redis');
    try {
      await this.redis.ping();
      return indicator.up();
    } catch (err) {
      return indicator.down({
        message: err instanceof Error ? err.message : 'unknown error',
      });
    }
  };
}
