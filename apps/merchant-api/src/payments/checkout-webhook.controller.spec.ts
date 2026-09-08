import { BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Test } from '@nestjs/testing';
import type Stripe from 'stripe';
import { constructWebhookEvent } from 'payments';
import { DOMAIN_EVENTS, DomainEventBus } from 'src/shared/events';
import { CheckoutWebhookController } from './checkout-webhook.controller';

// payments is mocked so the module singleton in stripe.client.ts doesn't build
// a real client, and so the signature check is controllable
jest.mock('payments', () => ({
  createStripeClient: jest.fn(() => ({})),
  constructWebhookEvent: jest.fn(),
}));

const mockedConstruct = constructWebhookEvent as jest.MockedFunction<
  typeof constructWebhookEvent
>;

const baseSession = {
  id: 'cs_test_1',
  payment_status: 'paid',
  payment_intent: 'pi_test_1',
  metadata: { accountId: '7', cartToken: 'cart-tok', shippingLocationId: '3' },
  customer_details: { email: 'buyer@test.com', name: 'Test Buyer' },
  amount_total: 26845,
  shipping_cost: { amount_total: 845 },
  collected_information: {
    shipping_details: {
      name: 'Test Buyer',
      address: {
        line1: '1 Market St',
        line2: null,
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94105',
        country: 'US',
      },
    },
  },
};

function eventOf(
  type: string,
  sessionOverrides: Record<string, unknown> = {},
): Stripe.Event {
  return {
    type,
    data: { object: { ...baseSession, ...sessionOverrides } },
  } as unknown as Stripe.Event;
}

const REQ = {
  rawBody: Buffer.from('{}'),
  headers: { 'stripe-signature': 'sig_test' },
} as unknown as RawBodyRequest<FastifyRequest>;

async function build() {
  const emit = jest.fn();
  const ref = await Test.createTestingModule({
    controllers: [CheckoutWebhookController],
    providers: [{ provide: DomainEventBus, useValue: { emit } }],
  }).compile();
  return { controller: ref.get(CheckoutWebhookController), emit };
}

beforeEach(() => mockedConstruct.mockReset());

describe('CheckoutWebhookController', () => {
  it('throws a 400 when the signature does not verify', async () => {
    mockedConstruct.mockImplementation(() => {
      throw new BadRequestException('bad sig');
    });
    const { controller, emit } = await build();

    expect(() => controller.webhook(REQ)).toThrow(BadRequestException);
    expect(emit).not.toHaveBeenCalled();
  });

  it('emits checkout.session.paid for a paid completed session', async () => {
    mockedConstruct.mockReturnValue(eventOf('checkout.session.completed'));
    const { controller, emit } = await build();

    expect(controller.webhook(REQ)).toEqual({ received: true });
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(DOMAIN_EVENTS.CHECKOUT_SESSION_PAID, {
      accountId: 7,
      cartToken: 'cart-tok',
      checkoutSessionId: 'cs_test_1',
      paymentIntentId: 'pi_test_1',
      customerEmail: 'buyer@test.com',
      customerName: 'Test Buyer',
      amountTotalCents: 26845,
      shippingAmountCents: 845,
      shippingLocationId: 3,
      shippingAddress: {
        name: 'Test Buyer',
        line1: '1 Market St',
        line2: null,
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US',
      },
    });
  });

  it('also emits for async_payment_succeeded', async () => {
    mockedConstruct.mockReturnValue(
      eventOf('checkout.session.async_payment_succeeded'),
    );
    const { controller, emit } = await build();

    controller.webhook(REQ);

    expect(emit).toHaveBeenCalledWith(
      DOMAIN_EVENTS.CHECKOUT_SESSION_PAID,
      expect.objectContaining({ checkoutSessionId: 'cs_test_1' }),
    );
  });

  it('does not emit when the session is not paid', async () => {
    mockedConstruct.mockReturnValue(
      eventOf('checkout.session.completed', { payment_status: 'unpaid' }),
    );
    const { controller, emit } = await build();

    controller.webhook(REQ);

    expect(emit).not.toHaveBeenCalled();
  });

  it('does not emit when accountId or cartToken metadata is missing', async () => {
    const { controller, emit } = await build();
    for (const metadata of [{ cartToken: 'x' }, { accountId: '1' }, {}]) {
      mockedConstruct.mockReturnValue(
        eventOf('checkout.session.completed', { metadata }),
      );
      controller.webhook(REQ);
    }
    expect(emit).not.toHaveBeenCalled();
  });

  it('records no payment intent id when Stripe expands payment_intent to an object', async () => {
    mockedConstruct.mockReturnValue(
      eventOf('checkout.session.completed', { payment_intent: { id: 'pi_x' } }),
    );
    const { controller, emit } = await build();

    controller.webhook(REQ);

    expect(emit).toHaveBeenCalledWith(
      DOMAIN_EVENTS.CHECKOUT_SESSION_PAID,
      expect.objectContaining({ paymentIntentId: null }),
    );
  });

  it('ignores unrelated event types', async () => {
    mockedConstruct.mockReturnValue(eventOf('payment_intent.succeeded'));
    const { controller, emit } = await build();

    expect(controller.webhook(REQ)).toEqual({ received: true });
    expect(emit).not.toHaveBeenCalled();
  });

  it('falls back to nulls when the session omits amounts and shipping', async () => {
    mockedConstruct.mockReturnValue(
      eventOf('checkout.session.completed', {
        amount_total: null,
        shipping_cost: undefined,
        collected_information: undefined,
        customer_details: { email: null, name: null },
        metadata: { accountId: '7', cartToken: 'cart-tok' },
      }),
    );
    const { controller, emit } = await build();

    controller.webhook(REQ);

    expect(emit).toHaveBeenCalledWith(DOMAIN_EVENTS.CHECKOUT_SESSION_PAID, {
      accountId: 7,
      cartToken: 'cart-tok',
      checkoutSessionId: 'cs_test_1',
      paymentIntentId: 'pi_test_1',
      customerEmail: null,
      customerName: null,
      amountTotalCents: null,
      shippingAmountCents: null,
      shippingLocationId: null,
      shippingAddress: null,
    });
  });
});
