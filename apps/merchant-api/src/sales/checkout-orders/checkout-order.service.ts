import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Logger, getCorrelationId } from 'logging';
import type { OrderJobData } from 'queue';
import { env } from 'src/shared/env';
import type { CheckoutSessionPaidPayload } from 'src/shared/events';
import { CartsService } from '../carts/carts.service';

type CartItemOptionValue = { optionName: string; value: string };

// Turns a paid Stripe Checkout Session (a `checkout.session.paid` domain
// event) plus the customer's cart into the flattened snapshot apps/worker
// needs to write the order. The cart — not Stripe's line items — is the
// source of truth for what was ordered.
//
// Relocated from storefront-api's CheckoutService.handleWebhookEvent (M9):
// resolution is sales-domain logic; the worker still does the write.
@Injectable()
export class CheckoutOrderService {
  private readonly logger = new Logger(CheckoutOrderService.name);

  constructor(private readonly carts: CartsService) {}

  // null = nothing to order (cart already consumed by a prior delivery, or
  // empty) — the caller treats it as a no-op.
  async resolveOrderPayload(
    event: CheckoutSessionPaidPayload,
  ): Promise<OrderJobData | null> {
    const cart = await this.carts.findByToken(event.cartToken, event.accountId);
    if (!cart || cart.items.length === 0) {
      this.logger.warn(
        `checkout.session.paid ${event.checkoutSessionId}: cart ${event.cartToken} is gone or empty — no order created`,
      );
      return null;
    }

    const addr = event.shippingAddress;
    return {
      type: 'checkout-completed',
      correlationId: getCorrelationId() ?? randomUUID(),
      accountId: event.accountId,
      cartToken: event.cartToken,
      stripeCheckoutSessionId: event.checkoutSessionId,
      stripePaymentIntentId: event.paymentIntentId,
      customerEmail: event.customerEmail ?? '',
      customerName: event.customerName ?? addr?.name ?? '',
      shippingLine1: addr?.line1 ?? '',
      shippingLine2: addr?.line2 ?? null,
      shippingCity: addr?.city ?? '',
      shippingState: addr?.state ?? null,
      shippingPostalCode: addr?.postalCode ?? '',
      shippingCountry: addr?.country ?? '',
      subtotalCents: cart.subtotalCents,
      amountTotalCents: event.amountTotalCents ?? cart.subtotalCents,
      shippingCents: event.shippingAmountCents ?? 0,
      shippingLocationId: event.shippingLocationId,
      storefrontUrl: env.STOREFRONT_WEB_URL,
      items: cart.items.map((item) => ({
        variantId: item.variantId,
        productName: item.productName,
        sku: item.sku,
        optionsLabel: optionsLabel(item.optionValues) || null,
        priceCents: item.priceCents,
        quantity: item.quantity,
      })),
    };
  }
}

function optionsLabel(optionValues: CartItemOptionValue[]): string {
  return optionValues.map((ov) => `${ov.optionName}: ${ov.value}`).join(', ');
}
