import { BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

// The one place the pinned Stripe API version lives. Pinned so an SDK bump
// can't silently change request/response shapes under us; bump it here and
// every app moves together.
export const STRIPE_API_VERSION = '2026-08-26.dahlia';

// Both APIs create their Stripe client the same way. The SDK's default
// `timeout` is 80s — far too long to hold a request open (see the OS-346
// resilience audit); one retry covers a transient blip.
export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    timeout: 20_000,
    maxNetworkRetries: 1,
  });
}

// Verify a raw webhook body and return the event, or throw a 400 so Stripe
// stops retrying (a bad/missing signature is a client error, not a server
// fault). Deliberately coupled to `@nestjs/common` — both consumers are Nest
// apps and this removes the identical try/catch from every webhook endpoint.
export function constructWebhookEvent(
  stripe: Stripe,
  rawBody: Buffer | string | undefined | null,
  signature: string | string[] | undefined,
  secret: string,
): Stripe.Event {
  if (!rawBody || typeof signature !== 'string') {
    throw new BadRequestException('Missing Stripe webhook signature');
  }
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    throw new BadRequestException(
      `Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
