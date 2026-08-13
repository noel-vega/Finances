import { ApiProperty } from '@nestjs/swagger';
import type { FulfillmentStatus } from './order-detail.entity';

export class OrderListItem {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  customerEmail!: string;

  @ApiProperty({ type: Number })
  itemCount!: number;

  @ApiProperty({ type: Number })
  amountTotalCents!: number;

  @ApiProperty({ enum: ['unfulfilled', 'partially_fulfilled', 'fulfilled'] })
  fulfillmentStatus!: FulfillmentStatus;

  @ApiProperty()
  createdAt!: Date;
}
