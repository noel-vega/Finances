import { ApiProperty } from '@nestjs/swagger';
import { SelectCategory } from 'db/schema';

export class Category implements SelectCategory {
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
