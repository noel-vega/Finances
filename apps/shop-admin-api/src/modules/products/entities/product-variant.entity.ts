import { ApiProperty } from '@nestjs/swagger';
import { SelectProductVariant } from 'db/schema';

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


  @ApiProperty({type: "string", nullable: true})
  sku!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  weightOz!: number | null;

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt!: Date;

  @ApiProperty({ type: Number })
  stock!: number;

  @ApiProperty({ type: [VariantOptionValue] })
  optionValues!: VariantOptionValue[];
}
