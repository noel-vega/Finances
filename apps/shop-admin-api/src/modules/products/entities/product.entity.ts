import { ApiProperty } from '@nestjs/swagger';
import { SelectProduct, productStatusEnum } from 'db/schema';

export class Product implements SelectProduct {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({type: "string", nullable: true})
  description!: string | null;

  @ApiProperty({ enum: productStatusEnum.enumValues })
  status!: (typeof productStatusEnum.enumValues)[number];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({type: "number", nullable: true})
  brandId!: number | null;

  // only populated by findOne — findAll skips the extra join for list views
  @ApiProperty({ type: [Number], required: false })
  categoryIds?: number[];
}