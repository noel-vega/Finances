// The dashboard read-model's view of the `sales` context. `dashboard.service`
// depends on this interface, never on sales' concrete services — so if `sales`
// is ever extracted to its own service, only sales.adapter.ts changes (swap the
// in-process delegation for an HTTP client). See apps/merchant-api/ARCHITECTURE.md.

// OrderListItem / Customer are sales' published response DTOs (already in the
// SDK; merchant-web renders ColumnDef<OrderListItem> on both the dashboard and
// the orders list) — re-exported here so nothing else in the dashboard touches
// src/sales.
export { OrderListItem, Customer } from 'src/sales';
import type { OrderListItem, Customer } from 'src/sales';

export const SALES_PORT = Symbol('DASHBOARD_SALES_PORT');

export interface SalesPort {
  recentOrders(accountId: number, limit: number): Promise<OrderListItem[]>;
  recentCustomers(accountId: number, limit: number): Promise<Customer[]>;
}
