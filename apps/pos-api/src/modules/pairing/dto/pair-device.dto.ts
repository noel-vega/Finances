import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class PairDeviceDto {
  @ApiProperty({ description: 'The pairing code shown in the admin dashboard' })
  @IsString()
  @Length(6, 12)
  pairingCode!: string;
}
