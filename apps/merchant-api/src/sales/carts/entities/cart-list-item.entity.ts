import { ApiProperty } from '@nestjs/swagger';

export class CartListItem {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  token!: string;

  @ApiProperty({ type: Number })
  itemCount!: number;

  @ApiProperty({ type: Number })
  subtotalCents!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
