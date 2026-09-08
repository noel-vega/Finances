import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { FulfillmentsModule } from './fulfillments/fulfillments.module';
import { CartsModule } from './carts/carts.module';
import { CheckoutOrdersModule } from './checkout-orders/checkout-orders.module';
import { FailedOrdersModule } from './failed-orders/failed-orders.module';
import { CustomersModule } from './customers/customers.module';

// Sales: orders and their line items/payments/shipping, fulfillment, web
// checkout → order, the failed-order recovery surface, the merchant-side cart
// views, and the customer (CRM) record.
@Module({
  imports: [
    OrdersModule,
    FulfillmentsModule,
    CartsModule,
    CheckoutOrdersModule,
    FailedOrdersModule,
    CustomersModule,
  ],
})
export class SalesModule {}
