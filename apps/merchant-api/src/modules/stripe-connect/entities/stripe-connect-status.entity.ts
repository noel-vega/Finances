import { ApiProperty } from '@nestjs/swagger';

export class StripeConnectStatus {
  @ApiProperty()
  connected!: boolean;

  @ApiProperty()
  chargesEnabled!: boolean;

  @ApiProperty()
  detailsSubmitted!: boolean;
}
