import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateVariantDto {
  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiProperty({ type: 'string', nullable: true, required: false })
  @IsOptional()
  @IsString()
  sku?: string | null;
}
