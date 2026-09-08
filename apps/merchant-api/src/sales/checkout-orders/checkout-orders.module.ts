import { Module } from '@nestjs/common';
import { CartsModule } from '../carts/carts.module';
import { CheckoutOrderService } from './checkout-order.service';

// Web checkout → order. Consumes the payments context's `checkout.session.paid`
// domain event (handler lands in OS-356), resolves the cart, and enqueues the
// order job for apps/worker (producer registration lands in OS-354).
@Module({
  imports: [CartsModule],
  providers: [CheckoutOrderService],
  exports: [CheckoutOrderService],
})
export class CheckoutOrdersModule {}
