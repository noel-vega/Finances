import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class ReorderProductImagesDto {
  // full ordered list of image ids for one group (either every product-level
  // image, or every image belonging to one variant) — reordering only ever
  // happens within a single group in the UI
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  imageIds!: number[];
}
