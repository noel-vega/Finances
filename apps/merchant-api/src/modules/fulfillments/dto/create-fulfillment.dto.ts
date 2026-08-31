import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FulfillmentItemInput } from './fulfillment-item-input.dto';

// the client already has rateObjectId/provider/servicelevel/amountCents
// from the preceding POST /fulfillments/rates call — sent back rather than
// re-derived, same reasoning as orders' old BuyShippingLabelDto
export class CreateFulfillmentDto {
  @ApiProperty({ type: Number })
  @IsInt()
  orderId!: number;

  @ApiProperty({ type: Number })
  @IsInt()
  locationId!: number;

  @ApiProperty({ type: () => [FulfillmentItemInput] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FulfillmentItemInput)
  items!: FulfillmentItemInput[];

  @ApiProperty()
  @IsString()
  rateObjectId!: string;

  @ApiProperty()
  @IsString()
  provider!: string;

  @ApiProperty()
  @IsString()
  servicelevel!: string;

  @ApiProperty({ type: Number })
  @IsInt()
  amountCents!: number;
}
