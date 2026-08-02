import { ApiProperty } from '@nestjs/swagger';

export class ProductOptionValue {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: String })
  value!: string;
}

export class ProductOption {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  productId!: number;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: [ProductOptionValue] })
  values!: ProductOptionValue[];
}
