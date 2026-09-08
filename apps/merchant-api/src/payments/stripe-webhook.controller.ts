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
import { StripeConnectService } from './stripe-connect.service';
import { stripe } from './stripe.client';

// The one Stripe webhook endpoint — a Stripe event destination is a single URL
// + a single signing secret, so both the Connect (`account.updated`) and
// Checkout (`checkout.session.*`) events land here and are dispatched by type.
// Subscribed in the Stripe Dashboard to "events on connected accounts", as
// Snapshot (v1) events (the payload shapes below are v1 Connect / Checkout).
//
// The checkout webhook was moved off storefront-api in M9 (OS-357); the two
// merchant-api controllers were merged here in OS-360.
@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeConnect: StripeConnectService,
    private readonly events: DomainEventBus,
  ) {}

  @Public()
  @Post('stripe')
  @ApiExcludeEndpoint()
  async handle(@Req() req: RawBodyRequest<FastifyRequest>) {
    // verifies the signature or throws a 400 (see packages/payments)
    const event = constructWebhookEvent(
      stripe,
      req.rawBody,
      req.headers['stripe-signature'],
      env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case 'account.updated': {
        // the durable path for keeping charges_enabled / details_submitted in
        // sync — event.account is the connected account id on a Connect event
        if (event.account) {
          const account = event.data.object;
          await this.stripeConnect.handleAccountUpdated(event.account, {
            charges_enabled: account.charges_enabled,
            details_submitted: account.details_submitted,
          });
        }
        break;
      }

      // async_payment_succeeded = a delayed payment method settled after the
      // session first "completed" unpaid — same paid path as completed.
      // OS-115 adds checkout.session.expired / .async_payment_failed here.
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const payload = toPaidPayload(event.data.object);
        if (payload) {
          // emitAsync, not emit: if the sales handler can't enqueue the order
          // (e.g. Redis is down) this rejects, the endpoint returns non-2xx,
          // and Stripe redelivers — a paid order must never be silently lost.
          await this.events.emitAsync(
            DOMAIN_EVENTS.CHECKOUT_SESSION_PAID,
            payload,
          );
        } else {
          this.logger.log(
            `${event.type} ${event.data.object.id}: not paid or missing accountId/cartToken metadata — ignored`,
          );
        }
        break;
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
