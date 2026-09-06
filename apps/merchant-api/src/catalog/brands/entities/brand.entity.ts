import { ApiProperty } from '@nestjs/swagger';
import { SelectBrand } from 'db/catalog';

export class Brand implements SelectBrand {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  accountId!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
