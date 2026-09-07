import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/shared/database/database.constants';
import {
  eq,
  inventoryTable,
  ordersTable,
  productsTable,
  productVariantsTable,
  sql,
  type db as Db,
} from 'db';
import { DashboardSummary } from './entities/dashboard-summary.entity';
import { SALES_PORT, type SalesPort } from './ports/sales.port';

const RECENT_LIMIT = 5;

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE) private readonly db: typeof Db,
    @Inject(SALES_PORT) private readonly sales: SalesPort,
  ) {}

  async getSummary(accountId: number): Promise<DashboardSummary> {
    const [recentOrders, recentCustomers, totals, outOfStockCount] =
      await Promise.all([
        this.sales.recentOrders(accountId, RECENT_LIMIT),
        this.sales.recentCustomers(accountId, RECENT_LIMIT),
        this.getOrderTotals(accountId),
        this.getOutOfStockCount(accountId),
      ]);

    return { ...totals, outOfStockCount, recentOrders, recentCustomers };
  }

  private async getOrderTotals(accountId: number) {
    const [totals] = await this.db
      .select({
        orderCount: sql<number>`count(*)::int`,
        revenueCents: sql<number>`coalesce(sum(${ordersTable.amountTotalCents}), 0)::int`,
      })
      .from(ordersTable)
      .where(eq(ordersTable.accountId, accountId));

    return totals;
  }

  // counted in JS rather than a SQL HAVING clause — simpler to read, and
  // account-scale here doesn't warrant the extra query complexity
  private async getOutOfStockCount(accountId: number) {
    const rows = await this.db
      .select({
        variantId: productVariantsTable.id,
        totalStock: sql<number>`coalesce(sum(${inventoryTable.stock}), 0)::int`,
      })
      .from(productVariantsTable)
      .innerJoin(
        productsTable,
        eq(productsTable.id, productVariantsTable.productId),
      )
      .leftJoin(
        inventoryTable,
        eq(inventoryTable.variantId, productVariantsTable.id),
      )
      .where(eq(productsTable.accountId, accountId))
      .groupBy(productVariantsTable.id);

    return rows.filter((row) => row.totalStock <= 0).length;
  }
}
