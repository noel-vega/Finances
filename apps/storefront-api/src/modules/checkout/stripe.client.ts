import Stripe from 'stripe';
import { env } from '../../env';

// platform's own secret key — sessions are created directly on a merchant's
// connected account via the `stripeAccount` request option, so funds never
// touch the platform
export const stripe: Stripe = new Stripe(env.STRIPE_SECRET_KEY);
