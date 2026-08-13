import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { QUEUE_NAMES } from 'queue';
import { sql, type db as Db } from 'db';
import { DRIZZLE } from '../../database/database.constants';
import { OrdersProcessor } from '../orders/orders.processor';
import { EmailProcessor } from '../email/email.processor';

// a "wait" job sitting untouched this long, with the worker still running
// and unpaused, means the consumption loop is wedged, not just quiet —
// healthy pickup normally happens in well under a second
const STALL_THRESHOLD_MS = 60_000;

@Injectable()
export class HealthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: typeof Db,
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly ordersProcessor: OrdersProcessor,
    private readonly emailProcessor: EmailProcessor,
    @InjectQueue(QUEUE_NAMES.ORDERS) private readonly ordersQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
  ) {}

  checkDatabase = async () => {
    const indicator = this.healthIndicatorService.check('database');
    try {
      await this.db.execute(sql`select 1`);
      return indicator.up();
    } catch (err) {
      return indicator.down({ message: err instanceof Error ? err.message : 'unknown error' });
    }
  };

  // round-trips through BullMQ's own connection (its documented escape
  // hatch, queue.getBackend().client) instead of a separate one — but note
  // this only proves Redis is reachable. Per the worker-reconnect-stall
  // issue, the socket-level connection reconnects fine and keeps answering
  // info() even when the consumption loop itself is wedged, so a stalled
  // worker needs checkOrdersQueue / checkEmailQueue below to actually be
  // caught. IRedisClient (bullmq's adapter-agnostic client interface) has
  // no ping() — info() is the equivalent live round-trip it does expose
  checkRedis = async () => {
    const indicator = this.healthIndicatorService.check('redis');
    try {
      const client = await this.ordersQueue.getBackend().client;
      await client.info();
      return indicator.up();
    } catch (err) {
      return indicator.down({ message: err instanceof Error ? err.message : 'unknown error' });
    }
  };

  checkOrdersQueue = () => this.checkQueueConsumption('orders', this.ordersProcessor, this.ordersQueue);
  checkEmailQueue = () => this.checkQueueConsumption('email', this.emailProcessor, this.emailQueue);

  // unhealthy only when there's a backlog in `wait` (jobs ready to run
  // right now, not delayed retries) AND nothing has gone active recently —
  // an empty, idle queue never trips this, only one that isn't draining
  private checkQueueConsumption = async (
    name: string,
    processor: OrdersProcessor | EmailProcessor,
    queue: Queue,
  ) => {
    const indicator = this.healthIndicatorService.check(`${name}-queue`);
    try {
      const { isRunning, isPaused, lastActiveAt } = processor.getLiveness();
      if (!isRunning) {
        return indicator.down({ message: 'worker is not running' });
      }
      if (isPaused) {
        return indicator.up({ paused: true });
      }

      const waiting = await queue.getWaitingCount();
      const idleMs = lastActiveAt ? Date.now() - lastActiveAt.getTime() : null;
      if (waiting > 0 && (idleMs === null || idleMs > STALL_THRESHOLD_MS)) {
        const detail = idleMs === null ? 'none picked up yet' : `none picked up in the last ${Math.round(idleMs / 1000)}s`;
        return indicator.down({ message: `${waiting} job(s) waiting, ${detail}` });
      }
      return indicator.up();
    } catch (err) {
      return indicator.down({ message: err instanceof Error ? err.message : 'unknown error' });
    }
  };
}
