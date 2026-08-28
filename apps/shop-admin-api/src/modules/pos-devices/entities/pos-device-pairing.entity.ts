import { ApiProperty } from '@nestjs/swagger';

// Returned once when a device is created or its pairing code is rotated. The
// staff member reads `pairingCode` onto the physical device, which redeems it
// (against pos-api) for its long-lived token before `pairingExpiresAt`.
export class PosDevicePairing {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: Number })
  locationId!: number;

  @ApiProperty()
  pairingCode!: string;

  @ApiProperty({ type: Date })
  pairingExpiresAt!: Date;
}
