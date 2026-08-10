import { ApiProperty } from '@nestjs/swagger';
import { OrderListItem } from './order-list-item.entity';

export class PaginatedOrders {
  @ApiProperty({ type: () => [OrderListItem] })
  items!: OrderListItem[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  limit!: number;

  @ApiProperty({ type: Number })
  offset!: number;
}
