import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ORDER_JOB_OPTIONS, QUEUE_NAMES } from 'queue';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    CartModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.ORDERS,
      defaultJobOptions: ORDER_JOB_OPTIONS,
    }),
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
