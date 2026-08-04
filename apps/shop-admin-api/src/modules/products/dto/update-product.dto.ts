import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { productStatusEnum } from 'db/schema';

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: productStatusEnum.enumValues, required: false })
  @IsOptional()
  @IsIn(productStatusEnum.enumValues)
  status?: (typeof productStatusEnum.enumValues)[number];

  @ApiProperty({ type: 'number', nullable: true, required: false })
  @IsOptional()
  brandId?: number | null;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];
}
