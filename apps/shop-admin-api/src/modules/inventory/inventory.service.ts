import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.constants';
import {
  eq,
  inventoryTable,
  locationsTable,
  productsTable,
  productVariantsTable,
  type db as Db,
} from 'db';
import { InventoryRecord } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async findAll(): Promise<InventoryRecord[]> {
    return await this.db
      .select({
        id: inventoryTable.id,
        variantId: inventoryTable.variantId,
        sku: productVariantsTable.sku,
        productId: productsTable.id,
        productName: productsTable.name,
        locationId: locationsTable.id,
        locationName: locationsTable.name,
        stock: inventoryTable.stock,
        updatedAt: inventoryTable.updatedAt,
      })
      .from(inventoryTable)
      .innerJoin(
        productVariantsTable,
        eq(productVariantsTable.id, inventoryTable.variantId),
      )
      .innerJoin(
        productsTable,
        eq(productsTable.id, productVariantsTable.productId),
      )
      .innerJoin(locationsTable, eq(locationsTable.id, inventoryTable.locationId));
  }
}
