import { ApiProperty } from '@nestjs/swagger';
import { ProductListItem } from './product-list-item.entity';

export class PaginatedProducts {
  @ApiProperty({ type: () => [ProductListItem] })
  items!: ProductListItem[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  limit!: number;

  @ApiProperty({ type: Number })
  offset!: number;
}
