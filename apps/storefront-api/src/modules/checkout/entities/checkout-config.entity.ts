import { ApiProperty } from '@nestjs/swagger';

export class CheckoutConfig {
  // false if the merchant hasn't finished connecting Stripe yet — the
  // storefront should show a "not accepting payments" state instead of
  // attempting to mount checkout
  @ApiProperty()
  ready!: boolean;

  // needed client-side to scope Stripe.js to the merchant's connected
  // account: loadStripe(publishableKey, { stripeAccount })
  @ApiProperty({ type: 'string', nullable: true })
  stripeAccountId!: string | null;
}
