// The registry of merchant-api domain events — the contract between the
// context that emits an event and the one(s) that react to it. It lives in the
// shared kernel because an event payload is shared by producer and consumer and
// belongs to neither context. Event names are dot-namespaced by owning context.
//
// In-process only (EventEmitter2): delivery is synchronous, on the emitting
// call stack, and NOT durable — a crash mid-handler loses the event. A handler
// that must do durable work (enqueue a job, write a row) does it within the
// emitting request's lifetime and tolerates a retry; a rejected async handler
// becomes an unhandledRejection, so handlers catch their own errors. Use a
// domain event for a genuine reactive side-effect; use a service call through a
// context's barrel (or a port) for a synchronous read.

export const DOMAIN_EVENTS = {
  // owner: payments. A Stripe Checkout Session reached a fully-paid state —
  // card success, or a delayed payment method settling later. The sales
  // context converts it into an order. Emitted by the checkout webhook
  // controller; see M9 (OS-355 / OS-356).
  CHECKOUT_SESSION_PAID: 'checkout.session.paid',
} as const;

// The Stripe Checkout Session narrowed to the fields order creation reads,
// plus the merchant account and cart resolved from its metadata. payments
// builds this from the verified webhook event; sales consumes it.
export interface CheckoutSessionPaidPayload {
  accountId: number;
  cartToken: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  amountTotalCents: number | null;
  shippingAmountCents: number | null;
  shippingLocationId: number | null;
  shippingAddress: {
    name: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
}

// Producer: `DomainEventBus.emit(name, payload)`. Consumer: a provider method
// decorated `@OnDomainEvent(name)` with its parameter typed `DomainEventMap[name]`.
// Every event adds its entry here next to its `DOMAIN_EVENTS` constant.
export interface DomainEventMap {
  [DOMAIN_EVENTS.CHECKOUT_SESSION_PAID]: CheckoutSessionPaidPayload;
}
