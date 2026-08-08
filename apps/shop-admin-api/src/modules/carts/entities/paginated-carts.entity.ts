import { ApiProperty } from '@nestjs/swagger';
import { CartListItem } from './cart-list-item.entity';

export class PaginatedCarts {
  @ApiProperty({ type: () => [CartListItem] })
  items!: CartListItem[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  limit!: number;

  @ApiProperty({ type: Number })
  offset!: number;
}
