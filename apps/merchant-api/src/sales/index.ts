export { SalesModule } from './sales.module';
// read-only surface consumed by the platform/dashboard read-model —
// reached only through platform/dashboard/ports/sales.adapter.ts
export { OrdersModule } from './orders/orders.module';
export { OrdersService } from './orders/orders.service';
export { CustomersModule } from './customers/customers.module';
export { CustomersService } from './customers/customers.service';
export { OrderListItem } from './orders/entities/order-list-item.entity';
export { Customer } from './customers/entities/customer.entity';
