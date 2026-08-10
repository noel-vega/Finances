import { ApiProperty } from '@nestjs/swagger';

class OrderDetailItem {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number, nullable: true })
  variantId!: number | null;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ type: 'string', nullable: true })
  sku!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  optionsLabel!: string | null;

  @ApiProperty({ type: Number })
  priceCents!: number;

  @ApiProperty({ type: Number })
  quantity!: number;
}

export class OrderDetail {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  customerEmail!: string;

  @ApiProperty()
  shippingLine1!: string;

  @ApiProperty({ type: 'string', nullable: true })
  shippingLine2!: string | null;

  @ApiProperty()
  shippingCity!: string;

  @ApiProperty({ type: 'string', nullable: true })
  shippingState!: string | null;

  @ApiProperty()
  shippingPostalCode!: string;

  @ApiProperty()
  shippingCountry!: string;

  @ApiProperty({ type: Number })
  subtotalCents!: number;

  @ApiProperty({ type: Number })
  amountTotalCents!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: () => [OrderDetailItem] })
  items!: OrderDetailItem[];
}
