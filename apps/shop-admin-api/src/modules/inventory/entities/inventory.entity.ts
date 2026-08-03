import { ApiProperty } from '@nestjs/swagger';

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
