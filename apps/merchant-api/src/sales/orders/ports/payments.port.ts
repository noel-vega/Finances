// `sales`' view of the `payments` context — the one refund operation the order
// lifecycle needs. `RefundsService` depends on this interface, never on
// `payments`' concrete service, so if `payments` is ever extracted (it's
// extraction seam #1) only payments.adapter.ts changes. See ARCHITECTURE.md.

export const PAYMENTS_PORT = Symbol('SALES_PAYMENTS_PORT');

export interface PaymentsPort {
  // Issues a Stripe refund on the connected account that took the payment.
  // Throws ConflictException if Stripe reports it already fully refunded
  // (caller reconciles), BadGatewayException for any other Stripe failure.
  refundPaymentIntent(input: {
    accountId: number;
    paymentIntentId: string;
    amountCents: number;
    idempotencyKey: string;
  }): Promise<{ stripeRefundId: string }>;
}
