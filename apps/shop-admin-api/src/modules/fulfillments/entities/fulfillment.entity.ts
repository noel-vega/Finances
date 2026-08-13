import { ApiProperty } from '@nestjs/swagger';

export class FulfillmentItem {
  @ApiProperty({ type: Number })
  orderItemId!: number;

  @ApiProperty({ type: Number })
  quantity!: number;
}

// embedded in OrderDetail.fulfillments — see apps/shop-admin-api's
// orders/entities/order-detail.entity.ts
export class Fulfillment {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  locationId!: number;

  @ApiProperty()
  locationName!: string;

  @ApiProperty({ type: 'string', nullable: true })
  shippingCarrier!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  shippingServiceLevel!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  trackingNumber!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  trackingUrl!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  labelUrl!: string | null;

  @ApiProperty({ type: Number })
  amountCents!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: () => [FulfillmentItem] })
  items!: FulfillmentItem[];
}
