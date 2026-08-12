import { ApiProperty } from '@nestjs/swagger';
import { ProductImage } from './product-image.entity';

class ProductDetailBrand {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;
}

class ProductDetailCategory {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;
}

class ProductDetailOptionValue {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  value!: string;
}

// e.g. { id, name: "Size", values: [{ id, value: "8" }, { id, value: "9" }] }
// — the full set of choices, for building a variant picker
class ProductDetailOption {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: () => [ProductDetailOptionValue] })
  values!: ProductDetailOptionValue[];
}

class VariantOptionValue {
  @ApiProperty()
  optionName!: string;

  @ApiProperty()
  value!: string;
}

// a single sellable unit, e.g. "Blue / Large" with its own price and stock
class ProductDetailVariant {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: 'string', nullable: true })
  sku!: string | null;

  @ApiProperty({ type: Number })
  priceCents!: number;

  @ApiProperty({ type: Number })
  stock!: number;

  @ApiProperty({ type: () => [VariantOptionValue] })
  optionValues!: VariantOptionValue[];

  // this variant's own images — empty means no override, fall back to the
  // product-level gallery below
  @ApiProperty({ type: () => [ProductImage] })
  images!: ProductImage[];
}

export class ProductDetail {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: 'string', nullable: true })
  description!: string | null;

  @ApiProperty({ type: () => ProductDetailBrand, nullable: true })
  brand!: ProductDetailBrand | null;

  @ApiProperty({ type: () => [ProductDetailCategory] })
  categories!: ProductDetailCategory[];

  @ApiProperty({ type: () => [ProductDetailOption] })
  options!: ProductDetailOption[];

  @ApiProperty({ type: () => [ProductDetailVariant] })
  variants!: ProductDetailVariant[];

  // product-level images only — the default/base gallery
  @ApiProperty({ type: () => [ProductImage] })
  images!: ProductImage[];
}
