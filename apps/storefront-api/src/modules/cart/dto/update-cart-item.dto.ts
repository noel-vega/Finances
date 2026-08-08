import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ type: Number })
  @IsInt()
  @Min(1)
  quantity!: number;
}
