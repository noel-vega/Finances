import { ApiProperty } from '@nestjs/swagger';
import { Fulfillment } from '../../fulfillments/entities/fulfillment.entity';

export type FulfillmentStatus = 'unfulfilled' | 'partially_fulfilled' | 'fulfilled';

class OrderItemAllocation {
  @ApiProperty({ type: Number })
  locationId!: number;

  @ApiProperty()
  locationName!: string;

  @ApiProperty({ type: Number })
  quantity!: number;
}

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

  @ApiProperty({ type: Number })
  fulfilledQuantity!: number;

  @ApiProperty({ type: Number })
  remainingQuantity!: number;

  // where this item's stock was actually pulled from at order time (see
  // inventoryMovementsTable.orderItemId) — informs which location(s) a
  // merchant can realistically ship this item from, but isn't a hard limit
  // enforced by the fulfillment endpoints (see FulfillmentsService)
  @ApiProperty({ type: () => [OrderItemAllocation] })
  allocations!: OrderItemAllocation[];
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

  @ApiProperty({ type: Number })
  shippingCents!: number;

  @ApiProperty({ type: Number, nullable: true })
  shippingLocationId!: number | null;

  // derived from items[].fulfilledQuantity vs .quantity at read time, not
  // stored — can't drift out of sync with the fulfillments that back it
  @ApiProperty({ enum: ['unfulfilled', 'partially_fulfilled', 'fulfilled'] })
  fulfillmentStatus!: FulfillmentStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: () => [OrderDetailItem] })
  items!: OrderDetailItem[];

  @ApiProperty({ type: () => [Fulfillment] })
  fulfillments!: Fulfillment[];
}
