import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';
import { FulfillmentItemInput } from './fulfillment-item-input.dto';

export class GetFulfillmentRatesDto {
  @ApiProperty({ type: Number })
  @IsInt()
  orderId!: number;

  // the ship-from location to quote rates from — not necessarily where the
  // requested items' inventory was originally allocated, just where the
  // merchant intends to physically ship from
  @ApiProperty({ type: Number })
  @IsInt()
  locationId!: number;

  @ApiProperty({ type: () => [FulfillmentItemInput] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FulfillmentItemInput)
  items!: FulfillmentItemInput[];
}
