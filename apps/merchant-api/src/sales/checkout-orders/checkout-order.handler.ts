import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { getCorrelationId, runWithCorrelationId } from 'logging';
import {
  DOMAIN_EVENTS,
  OnDomainEvent,
  type CheckoutSessionPaidPayload,
} from 'src/shared/events';
import { CheckoutOrderService } from './checkout-order.service';

// Reacts to `checkout.session.paid` (emitted by the payments context's checkout
// webhook): resolve the cart into an order payload and hand it to apps/worker.
//
// Errors are deliberately NOT caught. The webhook awaits this through
// DomainEventBus.emitAsync, so a failed resolve/enqueue returns a non-2xx and
// Stripe redelivers — a paid order must never be silently lost. The enqueue's
// own idempotency pre-check makes a redelivery safe.
@Injectable()
export class CheckoutOrderHandler {
  constructor(private readonly checkoutOrders: CheckoutOrderService) {}

  @OnDomainEvent(DOMAIN_EVENTS.CHECKOUT_SESSION_PAID)
  async handle(event: CheckoutSessionPaidPayload): Promise<void> {
    await runWithCorrelationId(getCorrelationId() ?? randomUUID(), async () => {
      const payload = await this.checkoutOrders.resolveOrderPayload(event);
      if (payload) await this.checkoutOrders.enqueue(payload);
    });
  }
}
