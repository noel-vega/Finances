import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'queue';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { OrdersModule } from '../orders/orders.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TerminusModule,
    // gives HealthService its own Queue client per queue, purely for
    // getWaitingCount()/getBackend().client — a Queue client is a
    // producer/inspector handle, not a consumer, so this doesn't spin up a
    // second worker (same pattern OrdersModule already uses to get an
    // email-queue producer)
    BullModule.registerQueue({ name: QUEUE_NAMES.ORDERS }),
    BullModule.registerQueue({ name: QUEUE_NAMES.EMAIL }),
    OrdersModule,
    EmailModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
