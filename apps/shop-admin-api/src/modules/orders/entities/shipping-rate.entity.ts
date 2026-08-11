import { ApiProperty } from '@nestjs/swagger';

export class ShippingRate {
  @ApiProperty()
  objectId!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  servicelevel!: string;

  @ApiProperty({ type: Number })
  amountCents!: number;

  @ApiProperty({ type: Number, nullable: true })
  estimatedDays!: number | null;
}
