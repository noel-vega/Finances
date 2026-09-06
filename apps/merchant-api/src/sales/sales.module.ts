import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { FulfillmentsModule } from './fulfillments/fulfillments.module';
import { CartsModule } from './carts/carts.module';
import { CustomersModule } from './customers/customers.module';

// Sales: orders and their line items/payments/shipping, fulfillment, the
// merchant-side cart views, and the customer (CRM) record.
@Module({
  imports: [OrdersModule, FulfillmentsModule, CartsModule, CustomersModule],
})
export class SalesModule {}
