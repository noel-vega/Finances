import { ApiProperty } from '@nestjs/swagger';
import { OrderListItem, Customer } from 'src/sales';

export class DashboardSummary {
  @ApiProperty({ type: Number })
  orderCount!: number;

  @ApiProperty({ type: Number })
  revenueCents!: number;

  // variants with zero stock across all locations — the only "stock is a
  // problem" concept that exists anywhere in the app today (see
  // product-inventory-tab.tsx's identical stock <= 0 badge). Not a
  // configurable reorder-point "low stock" alert — no such field exists yet.
  @ApiProperty({ type: Number })
  outOfStockCount!: number;

  @ApiProperty({ type: [OrderListItem] })
  recentOrders!: OrderListItem[];

  @ApiProperty({ type: [Customer] })
  recentCustomers!: Customer[];
}
