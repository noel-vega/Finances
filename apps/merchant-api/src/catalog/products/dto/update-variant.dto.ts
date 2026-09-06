import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

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

  // used for shipping rate quotes — nullable, falls back to a default
  // weight elsewhere rather than requiring this up front
  @ApiProperty({ type: Number, nullable: true, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  weightOz?: number | null;

  // full replacement of this variant's scannable codes when present —
  // omit to leave them untouched
  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  barcodes?: string[];
}
