import Stripe from 'stripe';
import { env } from '../env';

// platform's own secret key — Connect API calls act on behalf of a
// connected account via the `stripeAccount` request option, not a
// per-merchant key
// pin the API version so an SDK bump can't silently change request/response
// shapes under us (matches stripe@22's built-in default)
export const stripe: Stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-08-26.dahlia',
});
