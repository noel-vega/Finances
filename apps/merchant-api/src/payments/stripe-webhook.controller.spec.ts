import { BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Test } from '@nestjs/testing';
import type Stripe from 'stripe';
import { constructWebhookEvent } from 'payments';
import { DOMAIN_EVENTS, DomainEventBus } from 'src/shared/events';
import { StripeConnectService } from './stripe-connect.service';
import { StripeWebhookController } from './stripe-webhook.controller';

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

function checkoutEvent(
  type: string,
  sessionOverrides: Record<string, unknown> = {},
): Stripe.Event {
  return {
    type,
    data: { object: { ...baseSession, ...sessionOverrides } },
  } as unknown as Stripe.Event;
}

function accountUpdatedEvent(
  overrides: {
    account?: string | null;
    charges_enabled?: boolean;
    details_submitted?: boolean;
  } = {},
): Stripe.Event {
  return {
    type: 'account.updated',
    account: overrides.account === undefined ? 'acct_123' : overrides.account,
    data: {
      object: {
        charges_enabled: overrides.charges_enabled ?? true,
        details_submitted: overrides.details_submitted ?? true,
      },
    },
  } as unknown as Stripe.Event;
}

const REQ = {
  rawBody: Buffer.from('{}'),
  headers: { 'stripe-signature': 'sig_test' },
} as unknown as RawBodyRequest<FastifyRequest>;

async function build() {
  const emitAsync = jest.fn().mockResolvedValue(undefined);
  const handleAccountUpdated = jest.fn().mockResolvedValue(undefined);
  const ref = await Test.createTestingModule({
    controllers: [StripeWebhookController],
    providers: [
      { provide: DomainEventBus, useValue: { emitAsync } },
      { provide: StripeConnectService, useValue: { handleAccountUpdated } },
    ],
  }).compile();
  return {
    controller: ref.get(StripeWebhookController),
    emitAsync,
    handleAccountUpdated,
  };
}

beforeEach(() => mockedConstruct.mockReset());

describe('StripeWebhookController', () => {
  it('rejects with a 400 when the signature does not verify', async () => {
    mockedConstruct.mockImplementation(() => {
      throw new BadRequestException('bad sig');
    });
    const { controller, emitAsync, handleAccountUpdated } = await build();

    await expect(controller.handle(REQ)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(emitAsync).not.toHaveBeenCalled();
    expect(handleAccountUpdated).not.toHaveBeenCalled();
  });

  describe('account.updated', () => {
    it('syncs the connected account status', async () => {
      mockedConstruct.mockReturnValue(
        accountUpdatedEvent({
          charges_enabled: true,
          details_submitted: false,
        }),
      );
      const { controller, handleAccountUpdated } = await build();

      await expect(controller.handle(REQ)).resolves.toEqual({ received: true });
      expect(handleAccountUpdated).toHaveBeenCalledWith('acct_123', {
        charges_enabled: true,
        details_submitted: false,
      });
    });

    it('ignores the event when it carries no connected account id', async () => {
      mockedConstruct.mockReturnValue(accountUpdatedEvent({ account: null }));
      const { controller, handleAccountUpdated } = await build();

      await controller.handle(REQ);

      expect(handleAccountUpdated).not.toHaveBeenCalled();
    });
  });

  describe('checkout.session.*', () => {
    it('emits checkout.session.paid for a paid completed session', async () => {
      mockedConstruct.mockReturnValue(
        checkoutEvent('checkout.session.completed'),
      );
      const { controller, emitAsync } = await build();

      await expect(controller.handle(REQ)).resolves.toEqual({ received: true });
      expect(emitAsync).toHaveBeenCalledTimes(1);
      expect(emitAsync).toHaveBeenCalledWith(
        DOMAIN_EVENTS.CHECKOUT_SESSION_PAID,
        {
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
        },
      );
    });

    it('also emits for async_payment_succeeded', async () => {
      mockedConstruct.mockReturnValue(
        checkoutEvent('checkout.session.async_payment_succeeded'),
      );
      const { controller, emitAsync } = await build();

      await controller.handle(REQ);

      expect(emitAsync).toHaveBeenCalledWith(
        DOMAIN_EVENTS.CHECKOUT_SESSION_PAID,
        expect.objectContaining({ checkoutSessionId: 'cs_test_1' }),
      );
    });

    it('propagates a handler failure so Stripe redelivers', async () => {
      mockedConstruct.mockReturnValue(
        checkoutEvent('checkout.session.completed'),
      );
      const { controller, emitAsync } = await build();
      emitAsync.mockRejectedValue(new Error('redis down'));

      await expect(controller.handle(REQ)).rejects.toThrow('redis down');
    });

    it('does not emit when the session is not paid', async () => {
      mockedConstruct.mockReturnValue(
        checkoutEvent('checkout.session.completed', {
          payment_status: 'unpaid',
        }),
      );
      const { controller, emitAsync } = await build();

      await controller.handle(REQ);

      expect(emitAsync).not.toHaveBeenCalled();
    });

    it('does not emit when accountId or cartToken metadata is missing', async () => {
      const { controller, emitAsync } = await build();
      for (const metadata of [{ cartToken: 'x' }, { accountId: '1' }, {}]) {
        mockedConstruct.mockReturnValue(
          checkoutEvent('checkout.session.completed', { metadata }),
        );
        await controller.handle(REQ);
      }
      expect(emitAsync).not.toHaveBeenCalled();
    });

    it('records no payment intent id when Stripe expands payment_intent to an object', async () => {
      mockedConstruct.mockReturnValue(
        checkoutEvent('checkout.session.completed', {
          payment_intent: { id: 'pi_x' },
        }),
      );
      const { controller, emitAsync } = await build();

      await controller.handle(REQ);

      expect(emitAsync).toHaveBeenCalledWith(
        DOMAIN_EVENTS.CHECKOUT_SESSION_PAID,
        expect.objectContaining({ paymentIntentId: null }),
      );
    });

    it('falls back to nulls when the session omits amounts and shipping', async () => {
      mockedConstruct.mockReturnValue(
        checkoutEvent('checkout.session.completed', {
          amount_total: null,
          shipping_cost: undefined,
          collected_information: undefined,
          customer_details: { email: null, name: null },
          metadata: { accountId: '7', cartToken: 'cart-tok' },
        }),
      );
      const { controller, emitAsync } = await build();

      await controller.handle(REQ);

      expect(emitAsync).toHaveBeenCalledWith(
        DOMAIN_EVENTS.CHECKOUT_SESSION_PAID,
        {
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
        },
      );
    });
  });

  it('ignores unrelated event types', async () => {
    mockedConstruct.mockReturnValue(checkoutEvent('payment_intent.succeeded'));
    const { controller, emitAsync, handleAccountUpdated } = await build();

    await expect(controller.handle(REQ)).resolves.toEqual({ received: true });
    expect(emitAsync).not.toHaveBeenCalled();
    expect(handleAccountUpdated).not.toHaveBeenCalled();
  });
});
