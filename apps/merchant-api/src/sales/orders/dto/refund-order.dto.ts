import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class RefundOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  // whether to return the order's items to stock — defaults true
  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  restock?: boolean;
}
