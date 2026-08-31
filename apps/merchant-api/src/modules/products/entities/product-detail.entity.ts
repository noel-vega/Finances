import { ApiProperty } from '@nestjs/swagger';
import { productStatusEnum } from 'db/schema';
import { Brand } from '../../brands/entities/brand.entity';
import { ProductImage } from './product-image.entity';

// the shape returned by GET /products/:id — unlike the list endpoint, it's
// cheap here to resolve the brand relation and category links since it's a
// single row, so callers get the full brand instead of just its id
export class ProductDetail {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  accountId!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: 'string', nullable: true })
  description!: string | null;

  @ApiProperty({ enum: productStatusEnum.enumValues })
  status!: (typeof productStatusEnum.enumValues)[number];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: () => Brand, nullable: true })
  brand!: Brand | null;

  @ApiProperty({ type: [Number] })
  categoryIds!: number[];

  // product-level images only (variantId null) — the default/base gallery
  @ApiProperty({ type: [ProductImage] })
  images!: ProductImage[];
}
