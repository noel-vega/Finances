import type Stripe from 'stripe';
import { createStripeClient } from 'payments';
import { env } from 'src/shared/env';

// platform's own secret key — Connect API calls act on behalf of a connected
// account via the `stripeAccount` request option, not a per-merchant key.
// Version pin + timeouts live in `packages/payments`.
export const stripe: Stripe = createStripeClient(env.STRIPE_SECRET_KEY);
