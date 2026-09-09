import { BadGatewayException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import Stripe from 'stripe';
import { insertAccount, insertStripeAccount, useTestDb } from 'test-support';
import { DRIZZLE } from 'src/shared/database/database.constants';
import { STRIPE } from './payments.constants';
import { StripeRefundsService } from './refunds.service';

const db = useTestDb();

async function build(refundsCreate: jest.Mock) {
  const ref = await Test.createTestingModule({
    providers: [
      StripeRefundsService,
      { provide: DRIZZLE, useValue: db },
      { provide: STRIPE, useValue: { refunds: { create: refundsCreate } } },
    ],
  }).compile();
  return ref.get(StripeRefundsService);
}

async function seedConnected() {
  const account = await insertAccount(db);
  const stripeAccount = await insertStripeAccount(db, {
    accountId: account.id,
    stripeAccountId: 'acct_test_123',
  });
  return { accountId: account.id, connectedId: stripeAccount.stripeAccountId };
}

describe('StripeRefundsService.refundPaymentIntent', () => {
  it('creates the refund on the connected account with the amount + idempotency key', async () => {
    const { accountId } = await seedConnected();
    const create = jest.fn().mockResolvedValue({ id: 're_test_1' });
    const service = await build(create);

    const result = await service.refundPaymentIntent({
      accountId,
      paymentIntentId: 'pi_test_1',
      amountCents: 12345,
      idempotencyKey: 'refund-order-7-full',
    });

    expect(result).toEqual({ stripeRefundId: 're_test_1' });
    expect(create).toHaveBeenCalledWith(
      { payment_intent: 'pi_test_1', amount: 12345 },
      { stripeAccount: 'acct_test_123', idempotencyKey: 'refund-order-7-full' },
    );
  });

  it('409s when the account has no connected Stripe account', async () => {
    const account = await insertAccount(db);
    const service = await build(jest.fn());

    await expect(
      service.refundPaymentIntent({
        accountId: account.id,
        paymentIntentId: 'pi_x',
        amountCents: 100,
        idempotencyKey: 'k',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps charge_already_refunded to a 409', async () => {
    const { accountId } = await seedConnected();
    const err = new Stripe.errors.StripeInvalidRequestError({
      type: 'invalid_request_error',
      code: 'charge_already_refunded',
      message: 'Charge ch_1 has already been refunded.',
    });
    const service = await build(jest.fn().mockRejectedValue(err));

    await expect(
      service.refundPaymentIntent({
        accountId,
        paymentIntentId: 'pi_1',
        amountCents: 100,
        idempotencyKey: 'k',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps any other Stripe failure to a 502', async () => {
    const { accountId } = await seedConnected();
    const service = await build(
      jest.fn().mockRejectedValue(new Error('Stripe is down')),
    );

    await expect(
      service.refundPaymentIntent({
        accountId,
        paymentIntentId: 'pi_1',
        amountCents: 100,
        idempotencyKey: 'k',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
