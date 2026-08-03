import { ApiProperty } from '@nestjs/swagger';
import { SelectLocation } from 'db/schema';

export class Location implements SelectLocation {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
