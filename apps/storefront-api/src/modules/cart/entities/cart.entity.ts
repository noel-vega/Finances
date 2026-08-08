import { ApiProperty } from '@nestjs/swagger';

class CartItemOptionValue {
  @ApiProperty()
  optionName!: string;

  @ApiProperty()
  value!: string;
}

class CartItem {
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

  // current stock, surfaced for the caller to react to — not enforced
  // server-side at add-to-cart time, that's a checkout-time concern
  @ApiProperty({ type: Number })
  stock!: number;

  @ApiProperty({ type: () => [CartItemOptionValue] })
  optionValues!: CartItemOptionValue[];
}

export class Cart {
  @ApiProperty()
  token!: string;

  @ApiProperty({ type: () => [CartItem] })
  items!: CartItem[];

  @ApiProperty({ type: Number })
  subtotalCents!: number;

  @ApiProperty({ type: Number })
  itemCount!: number;
}
