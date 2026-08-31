import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_JOB_OPTIONS, QUEUE_NAMES } from 'queue';
import { OrdersProcessor } from './orders.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.ORDERS }),
    // OrdersProcessor also produces order-confirmation jobs onto the email
    // queue — this registration just gives it @InjectQueue access; it's the
    // same underlying queue EmailModule already registers/consumes from.
    // defaultJobOptions is repeated here (matches storefront-api's
    // email.module.ts) because BullMQ's defaultJobOptions live on the Queue
    // client instance, not the queue itself — EmailModule's registration
    // doesn't cover jobs added through this separate client
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMAIL,
      defaultJobOptions: EMAIL_JOB_OPTIONS,
    }),
  ],
  providers: [OrdersProcessor],
  // exported so HealthModule can query the same singleton instance's
  // isRunning()/lastActiveAt — see OrdersProcessor.getLiveness()
  exports: [OrdersProcessor],
})
export class OrdersModule {}
