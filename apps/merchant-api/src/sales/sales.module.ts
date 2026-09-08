import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { FulfillmentsModule } from './fulfillments/fulfillments.module';
import { CartsModule } from './carts/carts.module';
import { CheckoutOrdersModule } from './checkout-orders/checkout-orders.module';
import { CustomersModule } from './customers/customers.module';

// Sales: orders and their line items/payments/shipping, fulfillment, web
// checkout → order, the merchant-side cart views, and the customer (CRM) record.
@Module({
  imports: [
    OrdersModule,
    FulfillmentsModule,
    CartsModule,
    CheckoutOrdersModule,
    CustomersModule,
  ],
})
export class SalesModule {}
