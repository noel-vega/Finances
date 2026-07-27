import { ApiProperty } from '@nestjs/swagger';
import { SelectProduct, productStatusEnum } from 'db/schema';

export class Product implements SelectProduct {
  @ApiProperty({ type: Number })
  id!: number;

  name!: string;

  description!: string | null;

  status!: (typeof productStatusEnum.enumValues)[number];

  createdAt!: Date;

  updatedAt!: Date;
}