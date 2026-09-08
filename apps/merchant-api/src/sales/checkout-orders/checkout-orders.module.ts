import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ORDER_JOB_OPTIONS, QUEUE_NAMES } from 'queue';
import { CartsModule } from '../carts/carts.module';
import { CheckoutOrderService } from './checkout-order.service';
import { CheckoutOrderHandler } from './checkout-order.handler';

// Web checkout → order. `CheckoutOrderHandler` reacts to the payments context's
// `checkout.session.paid` domain event; `CheckoutOrderService` resolves the
// cart and enqueues the order job for apps/worker to write. Owns the
// orders-queue producer registration (moved here from storefront-api's
// CheckoutModule).
@Module({
  imports: [
    CartsModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.ORDERS,
      defaultJobOptions: ORDER_JOB_OPTIONS,
    }),
  ],
  providers: [CheckoutOrderService, CheckoutOrderHandler],
  exports: [CheckoutOrderService],
})
export class CheckoutOrdersModule {}
