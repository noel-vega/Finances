import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ORDER_JOB_OPTIONS, QUEUE_NAMES } from 'queue';
import { CartsModule } from '../carts/carts.module';
import { CheckoutOrderService } from './checkout-order.service';

// Web checkout → order. Consumes the payments context's `checkout.session.paid`
// domain event (handler lands in OS-356), resolves the cart, and enqueues the
// order job for apps/worker to write. Owns the orders-queue producer
// registration (moved here from storefront-api's CheckoutModule).
@Module({
  imports: [
    CartsModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.ORDERS,
      defaultJobOptions: ORDER_JOB_OPTIONS,
    }),
  ],
  providers: [CheckoutOrderService],
  exports: [CheckoutOrderService],
})
export class CheckoutOrdersModule {}
