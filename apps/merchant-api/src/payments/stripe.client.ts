import Stripe from 'stripe';
import { env } from 'src/shared/env';

// platform's own secret key — Connect API calls act on behalf of a
// connected account via the `stripeAccount` request option, not a
// per-merchant key
// pin the API version so an SDK bump can't silently change request/response
// shapes under us (matches stripe@22's built-in default)
export const stripe: Stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-08-26.dahlia',
  // the SDK default is 80s — far too long to hold a request. One retry is
  // enough for a transient blip; anything slower should fail fast.
  timeout: 20_000,
  maxNetworkRetries: 1,
});
