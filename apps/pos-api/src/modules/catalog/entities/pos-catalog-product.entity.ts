import { ApiProperty } from "@nestjs/swagger";

export class PosCatalogImage {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  url!: string;

  @ApiProperty({ type: Number })
  position!: number;
}

export class PosCatalogOptionValue {
  @ApiProperty()
  optionName!: string;

  @ApiProperty()
  value!: string;
}

export class PosCatalogVariant {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: "string", nullable: true })
  sku!: string | null;

  @ApiProperty({ type: [String] })
  barcodes!: string[];

  @ApiProperty({ type: Number })
  priceCents!: number;

  // on-hand at THIS device's location only — not summed across the account
  @ApiProperty({ type: Number })
  stock!: number;

  @ApiProperty({ type: () => [PosCatalogOptionValue] })
  optionValues!: PosCatalogOptionValue[];

  // this variant's first image, else the product's first image, else null
  @ApiProperty({ type: "string", nullable: true })
  imageUrl!: string | null;
}

export class PosCatalogBrand {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;
}

export class PosCatalogCategory {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;
}

export class PosCatalogProduct {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: "string", nullable: true })
  description!: string | null;

  @ApiProperty({ type: () => PosCatalogBrand, nullable: true })
  brand!: PosCatalogBrand | null;

  @ApiProperty({ type: () => [PosCatalogCategory] })
  categories!: PosCatalogCategory[];

  @ApiProperty({ type: () => [PosCatalogImage] })
  images!: PosCatalogImage[];

  @ApiProperty({ type: () => [PosCatalogVariant] })
  variants!: PosCatalogVariant[];
}
