import { ApiProperty } from '@nestjs/swagger';
import type { FulfillmentStatus, OrderChannel } from './order-detail.entity';

export class OrderListItem {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ enum: ['web', 'pos'] })
  channel!: OrderChannel;

  @ApiProperty({ type: 'string', nullable: true })
  customerName!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  customerEmail!: string | null;

  @ApiProperty({ type: Number })
  itemCount!: number;

  @ApiProperty({ type: Number })
  amountTotalCents!: number;

  @ApiProperty({ enum: ['unfulfilled', 'partially_fulfilled', 'fulfilled'] })
  fulfillmentStatus!: FulfillmentStatus;

  @ApiProperty()
  createdAt!: Date;
}
