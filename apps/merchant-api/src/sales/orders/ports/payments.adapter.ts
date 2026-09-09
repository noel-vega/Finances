import { Injectable } from '@nestjs/common';
import { StripeRefundsService } from 'src/payments';
import type { PaymentsPort } from './payments.port';

// The only place in `sales` that talks to the `payments` context's concrete
// service. In-process today; an HTTP client the day `payments` becomes its own
// service.
@Injectable()
export class PaymentsAdapter implements PaymentsPort {
  constructor(private readonly refunds: StripeRefundsService) {}

  refundPaymentIntent(input: {
    accountId: number;
    paymentIntentId: string;
    amountCents: number;
    idempotencyKey: string;
  }): Promise<{ stripeRefundId: string }> {
    return this.refunds.refundPaymentIntent(input);
  }
}
