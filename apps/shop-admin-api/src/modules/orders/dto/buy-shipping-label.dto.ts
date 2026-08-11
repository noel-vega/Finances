import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

// the client already has this from the preceding "get rates" call — sent
// back rather than re-derived, to avoid a redundant Shippo lookup
export class BuyShippingLabelDto {
  @ApiProperty()
  @IsString()
  rateObjectId!: string;

  @ApiProperty()
  @IsString()
  provider!: string;

  @ApiProperty()
  @IsString()
  servicelevel!: string;

  @ApiProperty()
  @IsInt()
  amountCents!: number;
}
