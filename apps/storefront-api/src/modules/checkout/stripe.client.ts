import Stripe from 'stripe';

// platform's own secret key — sessions are created directly on a merchant's
// connected account via the `stripeAccount` request option, so funds never
// touch the platform
export const stripe: Stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
