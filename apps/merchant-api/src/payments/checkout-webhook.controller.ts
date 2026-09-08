import { Controller, Post, Req, type RawBodyRequest } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { constructWebhookEvent } from 'payments';
import type Stripe from 'stripe';
import { Logger } from 'logging';
import { env } from 'src/shared/env';
import { Public } from 'src/shared/auth/decorators';
import {
  DOMAIN_EVENTS,
  DomainEventBus,
  type CheckoutSessionPaidPayload,
} from 'src/shared/events';
import { stripe } from './stripe.client';

// Stripe posts here for checkout events on connected accounts — its own
// Dashboard endpoint + signing secret (STRIPE_CHECKOUT_WEBHOOK_SECRET),
// separate from the Connect account.updated webhook. It verifies the
// signature and, for a fully-paid session, emits `checkout.session.paid`;
// the sales context turns that into an order. This controller never touches
// sales or the orders queue.
//
// Moved here from storefront-api's CheckoutController (M9): the webhook is a
// Stripe integration point, not a storefront-client concern.
@Controller('checkout')
export class CheckoutWebhookController {
  private readonly logger = new Logger(CheckoutWebhookController.name);

  constructor(private readonly events: DomainEventBus) {}

  @Public()
  @Post('webhook')
  @ApiExcludeEndpoint()
  webhook(@Req() req: RawBodyRequest<FastifyRequest>) {
    // verifies the signature or throws a 400 (see packages/payments)
    const event = constructWebhookEvent(
      stripe,
      req.rawBody,
      req.headers['stripe-signature'],
      env.STRIPE_CHECKOUT_WEBHOOK_SECRET,
    );

    // async_payment_succeeded = a delayed payment method settled after the
    // session first "completed" unpaid — same paid path as completed.
    // OS-115 adds checkout.session.expired / .async_payment_failed here.
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const payload = toPaidPayload(event.data.object);
      if (payload) {
        this.events.emit(DOMAIN_EVENTS.CHECKOUT_SESSION_PAID, payload);
      } else {
        this.logger.log(
          `${event.type} ${event.data.object.id}: not paid or missing accountId/cartToken metadata — ignored`,
        );
      }
    }

    return { received: true };
  }
}

// the paid session → the `checkout.session.paid` payload, or null when it
// isn't actually paid or is missing the metadata the storefront set at
// session-creation time
function toPaidPayload(
  session: Stripe.Checkout.Session,
): CheckoutSessionPaidPayload | null {
  if (session.payment_status !== 'paid') return null;

  const accountId = Number(session.metadata?.accountId);
  const cartToken = session.metadata?.cartToken;
  if (!accountId || !cartToken) return null;

  const shipping = session.collected_information?.shipping_details;
  return {
    accountId,
    cartToken,
    checkoutSessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null,
    customerEmail: session.customer_details?.email ?? null,
    customerName: session.customer_details?.name ?? null,
    amountTotalCents: session.amount_total ?? null,
    shippingAmountCents: session.shipping_cost?.amount_total ?? null,
    shippingLocationId: Number(session.metadata?.shippingLocationId) || null,
    shippingAddress: shipping
      ? {
          name: shipping.name ?? null,
          line1: shipping.address?.line1 ?? null,
          line2: shipping.address?.line2 ?? null,
          city: shipping.address?.city ?? null,
          state: shipping.address?.state ?? null,
          postalCode: shipping.address?.postal_code ?? null,
          country: shipping.address?.country ?? null,
        }
      : null,
  };
}
