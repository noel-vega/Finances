import { ApiProperty } from '@nestjs/swagger';
import { SelectPermission } from 'db/schema';

export class Permission implements SelectPermission {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  resource!: string;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  createdAt!: Date;
}
