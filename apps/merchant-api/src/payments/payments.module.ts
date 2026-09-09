import { Module } from '@nestjs/common';
import type Stripe from 'stripe';
import { createStripeClient } from 'payments';
import { env } from 'src/shared/env';
import { STRIPE } from './payments.constants';
import { StripeConnectController } from './stripe-connect.controller';
import { StripeConnectService } from './stripe-connect.service';
import { StripeWebhookController } from './stripe-webhook.controller';

const stripeProvider = {
  // platform's own secret key — Connect API calls act on behalf of a connected
  // account via the `stripeAccount` request option, not a per-merchant key.
  // Version pin + timeouts live in `packages/payments`.
  provide: STRIPE,
  useFactory: (): Stripe => createStripeClient(env.STRIPE_SECRET_KEY),
};

@Module({
  controllers: [StripeConnectController, StripeWebhookController],
  providers: [stripeProvider, StripeConnectService],
  exports: [STRIPE],
})
export class PaymentsModule {}
