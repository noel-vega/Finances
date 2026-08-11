import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

// mirrors Stripe's StripeEmbeddedCheckoutAddress shape verbatim — the
// client forwards what it gets from the onShippingDetailsChange callback
export class ShippingAddressDto {
  @ApiProperty()
  @IsString()
  country!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  line1?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;
}

export class ShippingDetailsDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  address!: ShippingAddressDto;
}

export class GetShippingOptionsDto {
  @ApiProperty()
  @IsString()
  checkoutSessionId!: string;

  @ApiProperty({ type: ShippingDetailsDto })
  @ValidateNested()
  @Type(() => ShippingDetailsDto)
  shippingDetails!: ShippingDetailsDto;
}
