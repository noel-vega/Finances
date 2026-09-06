import { ApiProperty } from '@nestjs/swagger';
import { SelectLocation } from 'db/schema';

export class Location implements SelectLocation {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  accountId!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: 'string', nullable: true })
  addressLine1!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  addressLine2!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  addressCity!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  addressState!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  addressPostalCode!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  addressCountry!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
