import { ApiProperty } from '@nestjs/swagger';

export const POS_DEVICE_STATUSES = ['pending', 'active', 'revoked'] as const;
export type PosDeviceStatus = (typeof POS_DEVICE_STATUSES)[number];

export class PosDevice {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: Number })
  locationId!: number;

  @ApiProperty({ type: 'string', nullable: true })
  locationName!: string | null;

  @ApiProperty({ enum: POS_DEVICE_STATUSES })
  status!: PosDeviceStatus;

  @ApiProperty({ type: Date, nullable: true })
  lastSeenAt!: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  pairedAt!: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  revokedAt!: Date | null;

  @ApiProperty({ type: Date })
  createdAt!: Date;
}
