import { ApiProperty } from '@nestjs/swagger';

class CartDetailItemOptionValue {
  @ApiProperty()
  optionName!: string;

  @ApiProperty()
  value!: string;
}

class CartDetailItem {
  @ApiProperty({ type: Number })
  variantId!: number;

  @ApiProperty({ type: Number })
  productId!: number;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ type: 'string', nullable: true })
  sku!: string | null;

  @ApiProperty({ type: Number })
  priceCents!: number;

  @ApiProperty({ type: Number })
  quantity!: number;

  @ApiProperty({ type: Number })
  stock!: number;

  @ApiProperty({ type: () => [CartDetailItemOptionValue] })
  optionValues!: CartDetailItemOptionValue[];
}

export class CartDetail {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  token!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: () => [CartDetailItem] })
  items!: CartDetailItem[];

  @ApiProperty({ type: Number })
  subtotalCents!: number;

  @ApiProperty({ type: Number })
  itemCount!: number;
}
