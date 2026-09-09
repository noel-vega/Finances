import { ApiProperty } from '@nestjs/swagger';
import { ORDER_STATUSES, type OrderStatus } from '../order-status';

export class OrderStatusChange {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ enum: ORDER_STATUSES })
  status!: OrderStatus;

  @ApiProperty({ enum: ORDER_STATUSES })
  previousStatus!: OrderStatus;
}
