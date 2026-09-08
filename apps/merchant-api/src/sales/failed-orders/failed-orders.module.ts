import { Module } from '@nestjs/common';
import { CheckoutOrdersModule } from '../checkout-orders/checkout-orders.module';
import { FailedOrdersService } from './failed-orders.service';
import { FailedOrdersController } from './failed-orders.controller';

// The recovery surface for the checkout → order path: list the paid checkouts
// whose order the worker couldn't write, and replay one. The worker writes the
// failed_orders rows (OrdersProcessor); this module reads + replays them via
// CheckoutOrdersModule's producer.
@Module({
  imports: [CheckoutOrdersModule],
  controllers: [FailedOrdersController],
  providers: [FailedOrdersService],
})
export class FailedOrdersModule {}
