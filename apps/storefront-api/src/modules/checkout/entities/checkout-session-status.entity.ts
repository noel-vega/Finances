import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSessionStatus {
  // 'open' (still in progress / abandoned) or 'complete' (paid)
  @ApiProperty()
  status!: string;

  @ApiProperty({ type: 'string', nullable: true })
  customerEmail!: string | null;
}
