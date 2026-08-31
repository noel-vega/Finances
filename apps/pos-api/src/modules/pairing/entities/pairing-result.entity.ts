import { ApiProperty } from "@nestjs/swagger";

export class PairingResult {
  // the long-lived credential — the device stores this and sends it as
  // x-pos-device-token on every subsequent request
  @ApiProperty()
  token!: string;

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
