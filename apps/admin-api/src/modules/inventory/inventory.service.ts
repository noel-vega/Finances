import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.constants';
import {
  and,
  desc,
  eq,
  inventoryMovementsTable,
  inventoryTable,
  locationsTable,
  productsTable,
  productVariantsTable,
  sql,
  usersTable,
  type db as Db,
  type SQL,
} from 'db';
import {
  InventoryRecord,
  InventoryMovementRecord,
} from './entities/inventory.entity';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';

@Injectable()
export class InventoryService {
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async findAll(accountId: number): Promise<InventoryRecord[]> {
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
      .innerJoin(
        locationsTable,
        eq(locationsTable.id, inventoryTable.locationId),
      )
      .where(eq(productsTable.accountId, accountId));
  }

  // insert a ledger entry and atomically fold its delta into the
  // materialized balance — the two never happen independently
  async createMovement(
    dto: CreateInventoryMovementDto,
    userId: number | undefined,
    accountId: number,
  ): Promise<InventoryMovementRecord> {
    const [variant] = await this.db
      .select({ id: productVariantsTable.id })
      .from(productVariantsTable)
      .innerJoin(
        productsTable,
        eq(productsTable.id, productVariantsTable.productId),
      )
      .where(
        and(
          eq(productVariantsTable.id, dto.variantId),
          eq(productsTable.accountId, accountId),
        ),
      );
    if (!variant) {
      throw new BadRequestException('Variant not found');
    }

    const [location] = await this.db
      .select({ id: locationsTable.id })
      .from(locationsTable)
      .where(
        and(
          eq(locationsTable.id, dto.locationId),
          eq(locationsTable.accountId, accountId),
        ),
      );
    if (!location) {
      throw new BadRequestException('Location not found');
    }

    const movementId = await this.db.transaction(async (tx) => {
      const [movement] = await tx
        .insert(inventoryMovementsTable)
        .values({
          variantId: dto.variantId,
          locationId: dto.locationId,
          delta: dto.delta,
          reason: dto.reason,
          note: dto.note ?? null,
          createdByUserId: userId ?? null,
        })
        .returning();

      await tx
        .insert(inventoryTable)
        .values({
          variantId: dto.variantId,
          locationId: dto.locationId,
          stock: dto.delta,
        })
        .onConflictDoUpdate({
          target: [inventoryTable.variantId, inventoryTable.locationId],
          set: {
            stock: sql`${inventoryTable.stock} + ${dto.delta}`,
            updatedAt: new Date(),
          },
        });

      return movement.id;
    });

    const [record] = await this.movementRecordsQuery(
      accountId,
      eq(inventoryMovementsTable.id, movementId),
    );
    return record;
  }

  async findMovements(accountId: number): Promise<InventoryMovementRecord[]> {
    return await this.movementRecordsQuery(accountId).orderBy(
      desc(inventoryMovementsTable.createdAt),
    );
  }

  private movementRecordsQuery(accountId: number, extraWhere?: SQL) {
    return this.db
      .select({
        id: inventoryMovementsTable.id,
        variantId: inventoryMovementsTable.variantId,
        sku: productVariantsTable.sku,
        productId: productsTable.id,
        productName: productsTable.name,
        locationId: locationsTable.id,
        locationName: locationsTable.name,
        delta: inventoryMovementsTable.delta,
        reason: inventoryMovementsTable.reason,
        note: inventoryMovementsTable.note,
        createdByEmail: usersTable.email,
        createdAt: inventoryMovementsTable.createdAt,
      })
      .from(inventoryMovementsTable)
      .innerJoin(
        productVariantsTable,
        eq(productVariantsTable.id, inventoryMovementsTable.variantId),
      )
      .innerJoin(
        productsTable,
        eq(productsTable.id, productVariantsTable.productId),
      )
      .innerJoin(
        locationsTable,
        eq(locationsTable.id, inventoryMovementsTable.locationId),
      )
      .leftJoin(
        usersTable,
        eq(usersTable.id, inventoryMovementsTable.createdByUserId),
      )
      .where(
        extraWhere
          ? and(eq(productsTable.accountId, accountId), extraWhere)
          : eq(productsTable.accountId, accountId),
      );
  }
}
