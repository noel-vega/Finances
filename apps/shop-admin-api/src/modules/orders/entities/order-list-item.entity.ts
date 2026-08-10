import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty()
  createdAt!: Date;
}
