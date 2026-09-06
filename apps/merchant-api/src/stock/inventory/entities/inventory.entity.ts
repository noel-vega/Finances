import { ApiProperty } from '@nestjs/swagger';
import { inventoryMovementReasonEnum } from 'db/stock';

// a single variant's on-hand quantity at a single location — the row-level
// unit stock is derived from; joined with variant/product/location for display
export class InventoryRecord {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  variantId!: number;

  @ApiProperty({ type: 'string', nullable: true })
  sku!: string | null;

  @ApiProperty({ type: Number })
  productId!: number;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ type: Number })
  locationId!: number;

  @ApiProperty()
  locationName!: string;

  @ApiProperty({ type: Number })
  stock!: number;

  @ApiProperty()
  updatedAt!: Date;
}

// a single ledger entry — joined with variant/product/location, plus who
// made the change, for display in the movement history view
export class InventoryMovementRecord {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  variantId!: number;

  @ApiProperty({ type: 'string', nullable: true })
  sku!: string | null;

  @ApiProperty({ type: Number })
  productId!: number;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ type: Number })
  locationId!: number;

  @ApiProperty()
  locationName!: string;

  @ApiProperty({ type: Number })
  delta!: number;

  @ApiProperty({ enum: inventoryMovementReasonEnum.enumValues })
  reason!: (typeof inventoryMovementReasonEnum.enumValues)[number];

  @ApiProperty({ type: 'string', nullable: true })
  note!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  createdByEmail!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
