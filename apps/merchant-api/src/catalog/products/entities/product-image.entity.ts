import { ApiProperty } from '@nestjs/swagger';

export class ProductImage {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  url!: string;

  @ApiProperty({ type: Number })
  position!: number;

  // null = product-level image; set = belongs to that one variant only
  @ApiProperty({ type: Number, nullable: true })
  variantId!: number | null;
}
