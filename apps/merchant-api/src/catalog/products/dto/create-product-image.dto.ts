import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProductImageDto {
  // the object key returned by the upload-url step, after the browser has
  // PUT the file directly to storage
  @ApiProperty()
  @IsString()
  @MinLength(1)
  key!: string;

  // omit for a product-level image; set to attach it to one variant only
  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @IsInt()
  variantId?: number;
}
