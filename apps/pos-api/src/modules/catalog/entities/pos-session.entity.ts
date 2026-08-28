import { ApiProperty } from '@nestjs/swagger';

export class PosSession {
  @ApiProperty({ type: Number })
  accountId!: number;

  @ApiProperty()
  accountName!: string;

  @ApiProperty({ type: Number })
  locationId!: number;

  @ApiProperty()
  locationName!: string;

  @ApiProperty()
  deviceName!: string;
}
