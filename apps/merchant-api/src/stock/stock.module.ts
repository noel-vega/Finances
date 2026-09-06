import { Module } from '@nestjs/common';
import { InventoryModule } from './inventory/inventory.module';
import { LocationsModule } from './locations/locations.module';

// Stock: per-location on-hand quantities, the movement ledger, and the
// locations stock lives at. Owns inventory / inventory_movements / locations.
@Module({
  imports: [InventoryModule, LocationsModule],
})
export class StockModule {}
