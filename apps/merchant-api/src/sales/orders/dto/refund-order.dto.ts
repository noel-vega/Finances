import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RefundLineDto {
  @ApiProperty({ type: Number })
  @IsInt()
  @Min(1)
  orderItemId!: number;

  @ApiProperty({ type: Number })
  @IsInt()
  @Min(1)
  quantity!: number;
}

// Three modes, at most one of amountCents / lines:
//  - neither → full refund of the outstanding balance (OS-121)
//  - amountCents → an ad-hoc partial amount; no restock
//  - lines → specific items/quantities; amount is derived from the snapshot
//    prices, and those units are restocked (unless restock: false)
export class RefundOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  // whether to return the refunded items to stock — defaults true; ignored for
  // an amountCents-only refund (nothing to tie the return to)
  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  restock?: boolean;

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @IsInt()
  @Min(1)
  amountCents?: number;

  @ApiProperty({ required: false, type: () => [RefundLineDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RefundLineDto)
  lines?: RefundLineDto[];
}
