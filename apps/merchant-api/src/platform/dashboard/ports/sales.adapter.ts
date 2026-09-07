import { Injectable } from '@nestjs/common';
import { CustomersService, OrdersService } from 'src/sales';
import type { Customer, OrderListItem, SalesPort } from './sales.port';

// The only place in platform/ that talks to sales' concrete services.
// In-process today; an HTTP client the day `sales` becomes its own service.
@Injectable()
export class SalesAdapter implements SalesPort {
  constructor(
    private readonly orders: OrdersService,
    private readonly customers: CustomersService,
  ) {}

  async recentOrders(
    accountId: number,
    limit: number,
  ): Promise<OrderListItem[]> {
    const { items } = await this.orders.findAll(limit, 0, accountId);
    return items;
  }

  recentCustomers(accountId: number, limit: number): Promise<Customer[]> {
    return this.customers.findRecent(accountId, limit);
  }
}
