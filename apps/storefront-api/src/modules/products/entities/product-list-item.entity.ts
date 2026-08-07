import { ApiProperty } from '@nestjs/swagger';

class ProductListBrand {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;
}

class ProductListCategory {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;
}

export class ProductListItem {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: 'string', nullable: true })
  description!: string | null;

  @ApiProperty({ type: () => ProductListBrand, nullable: true })
  brand!: ProductListBrand | null;

  @ApiProperty({ type: () => [ProductListCategory] })
  categories!: ProductListCategory[];

  // null when the product has no variants yet
  @ApiProperty({ type: 'number', nullable: true })
  minPriceCents!: number | null;

  @ApiProperty({ type: 'number', nullable: true })
  maxPriceCents!: number | null;
}
