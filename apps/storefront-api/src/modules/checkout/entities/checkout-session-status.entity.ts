import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSessionStatus {
  // Stripe Checkout Session `status`: 'open' (still in progress / abandoned),
  // 'complete' (checkout finished — check `paymentStatus` for whether it
  // actually paid), or 'expired' (the session TTL lapsed unpaid).
  @ApiProperty()
  status!: string;

  // Stripe Checkout Session `payment_status`: 'paid', 'unpaid', or
  // 'no_payment_required'. 'complete' + 'unpaid' means a delayed payment
  // method that hasn't settled yet (or failed) — the return page shows a
  // softer "we couldn't confirm your payment" instead of a hard failure.
  @ApiProperty()
  paymentStatus!: string;

  @ApiProperty({ type: 'string', nullable: true })
  customerEmail!: string | null;
}
