import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ type: Number })
  @IsInt()
  variantId!: number;

  @ApiProperty({ type: Number, required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
