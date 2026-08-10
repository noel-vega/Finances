import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class CreateCheckoutSessionDto {
  // Stripe appends ?session_id={CHECKOUT_SESSION_ID} to this on redirect —
  // kept plain here so it validates as a normal URL
  @ApiProperty()
  @IsUrl({ require_tld: false })
  returnUrl!: string;
}
