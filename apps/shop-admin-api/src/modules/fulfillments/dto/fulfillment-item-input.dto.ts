import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

// shared shape between GetFulfillmentRatesDto and CreateFulfillmentDto —
// "ship this many of this order item"
export class FulfillmentItemInput {
  @ApiProperty({ type: Number })
  @IsInt()
  orderItemId!: number;

  @ApiProperty({ type: Number })
  @IsInt()
  @Min(1)
  quantity!: number;
}
