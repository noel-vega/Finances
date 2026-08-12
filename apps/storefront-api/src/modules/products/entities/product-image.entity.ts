import { ApiProperty } from '@nestjs/swagger';

export class ProductImage {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  url!: string;

  @ApiProperty({ type: Number })
  position!: number;
}
