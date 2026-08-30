import Stripe from 'stripe';

// platform's own secret key — Connect API calls act on behalf of a
// connected account via the `stripeAccount` request option, not a
// per-merchant key
export const stripe: Stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
