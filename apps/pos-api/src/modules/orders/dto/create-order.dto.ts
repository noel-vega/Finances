import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateOrderItemDto {
  @ApiProperty({ type: Number })
  @IsInt()
  @Min(1)
  variantId!: number;

  @ApiProperty({ type: Number })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderPaymentDto {
  @ApiProperty({ enum: ["cash", "card"] })
  @IsIn(["cash", "card"])
  method!: "cash" | "card";

  // required for cash — what the customer handed over; must be >= the total
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  amountTenderedCents?: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: () => [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty({ type: () => CreateOrderPaymentDto })
  @ValidateNested()
  @Type(() => CreateOrderPaymentDto)
  payment!: CreateOrderPaymentDto;
}
