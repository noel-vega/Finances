import { ApiProperty } from '@nestjs/swagger';
import { SelectProductVariant } from 'db/catalog';
import { ProductImage } from './product-image.entity';

export class VariantOptionValue {
  @ApiProperty({ type: String })
  optionName!: string;

  @ApiProperty({ type: String })
  value!: string;
}

export class ProductVariant implements SelectProductVariant {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  productId!: number;

  @ApiProperty({ type: Number })
  priceCents!: number;

  @ApiProperty({ type: 'string', nullable: true })
  sku!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  weightOz!: number | null;

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt!: Date;

  @ApiProperty({ type: Number })
  stock!: number;

  @ApiProperty({ type: [String] })
  barcodes!: string[];

  @ApiProperty({ type: [VariantOptionValue] })
  optionValues!: VariantOptionValue[];

  // this variant's own images only — empty means it has no override and the
  // UI should fall back to the product-level gallery
  @ApiProperty({ type: [ProductImage] })
  images!: ProductImage[];
}
