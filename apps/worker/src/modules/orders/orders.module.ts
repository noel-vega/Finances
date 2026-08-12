import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'queue';
import { OrdersProcessor } from './orders.processor';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.ORDERS })],
  providers: [OrdersProcessor],
})
export class OrdersModule {}
