import { Module } from '@nestjs/common';
import { CustomersModule, OrdersModule } from 'src/sales';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { SALES_PORT } from './ports/sales.port';
import { SalesAdapter } from './ports/sales.adapter';

@Module({
  imports: [OrdersModule, CustomersModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    { provide: SALES_PORT, useClass: SalesAdapter },
  ],
})
export class DashboardModule {}
