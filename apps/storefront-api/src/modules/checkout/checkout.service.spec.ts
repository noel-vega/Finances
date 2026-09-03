import { BadRequestException, Logger } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { QUEUE_NAMES } from 'queue';
import { DRIZZLE } from '../../database/database.constants';
import { CartService } from '../cart/cart.service';
import { CheckoutService } from './checkout.service';
import { SHIPPO, STRIPE } from './checkout.constants';

// mimics drizzle's query builder: awaitable at any point in the chain, each
// await consuming the next entry in `results` in the order the service issues
// its queries. The db object itself is not thenable — only the chain is — so
// Nest's injector doesn't unwrap the `useValue` when it resolves the provider.
// (same shape as products.service.spec.ts)
function makeDb(results: unknown[][]) {
  let call = 0;
  const chain: Record<string, unknown> = {
    then: (resolve: (value: unknown) => void) => resolve(results[call++]),
  };
  for (const method of [
    'from',
    'leftJoin',
    'innerJoin',
    'where',
    'groupBy',
    'orderBy',
    'limit',
    'offset',
  ]) {
    chain[method] = jest.fn(() => chain);
  }
  return { select: jest.fn(() => chain) };
}

interface StripeMock {
  checkout: {
    sessions: { create: jest.Mock; retrieve: jest.Mock; update: jest.Mock };
  };
}

interface ShippoMock {
  shipments: { create: jest.Mock };
}

interface CartItem {
  variantId: number;
  quantity: number;
  productId: number;
  productName: string;
  sku: string | null;
  priceCents: number;
  stock: number;
  optionValues: { optionName: string; value: string }[];
}

const ACCOUNT_ID = 1;
const CONNECTED = 'acct_test_1';
const STRIPE_ACCOUNT_ROW = {
  accountId: ACCOUNT_ID,
  stripeAccountId: CONNECTED,
  chargesEnabled: true,
  detailsSubmitted: true,
};

function cartItem(over: Partial<CartItem> = {}): CartItem {
  return {
    variantId: 10,
    quantity: 1,
    productId: 5,
    productName: 'Nike Air Force 1',
    sku: 'AF1-8',
    priceCents: 11500,
    stock: 12,
    optionValues: [{ optionName: 'Size', value: '8' }],
    ...over,
  };
}

function cart(items: CartItem[] = [cartItem()], token = 'cart-tok-abc') {
  return {
    token,
    items,
    subtotalCents: items.reduce((s, i) => s + i.priceCents * i.quantity, 0),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
  };
}

function newStripeMock(): StripeMock {
  return {
    checkout: {
      sessions: { create: jest.fn(), retrieve: jest.fn(), update: jest.fn() },
    },
  };
}

async function build(opts: {
  db: unknown;
  getCart?: jest.Mock;
  stripe?: StripeMock;
  shippo?: ShippoMock;
}) {
  const stripe = opts.stripe ?? newStripeMock();
  const shippo = opts.shippo ?? { shipments: { create: jest.fn() } };
  const cartService = { getCart: opts.getCart ?? jest.fn() };

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      CheckoutService,
      { provide: DRIZZLE, useValue: opts.db },
      { provide: STRIPE, useValue: stripe },
      { provide: SHIPPO, useValue: shippo },
      { provide: CartService, useValue: cartService },
      {
        provide: getQueueToken(QUEUE_NAMES.ORDERS),
        useValue: { add: jest.fn() },
      },
    ],
  }).compile();

  return {
    service: moduleRef.get(CheckoutService),
    stripe,
    shippo,
    cartService,
  };
}

// jest records call args as `any[]`; hand back the first call's args as a
// typed tuple so the assertions below stay under no-unsafe-* lint rules
function firstCall(mock: jest.Mock): unknown[] {
  return (mock.mock.calls[0] ?? []) as unknown[];
}

describe('CheckoutService.createSession', () => {
  const dto = { returnUrl: 'http://localhost:3002/checkout/return' };

  it('builds line items from the cart, not from the client, on the connected account', async () => {
    const items = [
      cartItem({ priceCents: 11500, quantity: 2 }),
      cartItem({
        variantId: 11,
        productName: 'Air Jordan 1',
        priceCents: 18000,
        quantity: 1,
        optionValues: [{ optionName: 'Size', value: '10' }],
      }),
    ];
    const getCart = jest.fn().mockResolvedValue(cart(items));
    const { service, stripe } = await build({
      db: makeDb([[STRIPE_ACCOUNT_ROW]]),
      getCart,
    });
    stripe.checkout.sessions.create.mockResolvedValue({
      client_secret: 'cs_test_x_secret_y',
    });

    await service.createSession('cart-tok-abc', ACCOUNT_ID, dto);

    expect(getCart).toHaveBeenCalledWith('cart-tok-abc', ACCOUNT_ID);
    const [params, options] = firstCall(stripe.checkout.sessions.create) as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(params.line_items).toEqual([
      {
        price_data: {
          currency: 'usd',
          unit_amount: 11500,
          product_data: { name: 'Nike Air Force 1 (Size: 8)' },
        },
        quantity: 2,
      },
      {
        price_data: {
          currency: 'usd',
          unit_amount: 18000,
          product_data: { name: 'Air Jordan 1 (Size: 10)' },
        },
        quantity: 1,
      },
    ]);
    expect(options).toEqual({ stripeAccount: CONNECTED });
  });

  it('sets the embedded-checkout session shape, return_url and metadata', async () => {
    const { service, stripe } = await build({
      db: makeDb([[STRIPE_ACCOUNT_ROW]]),
      getCart: jest.fn().mockResolvedValue(cart()),
    });
    stripe.checkout.sessions.create.mockResolvedValue({
      client_secret: 'cs_x',
    });

    await service.createSession('cart-tok-abc', ACCOUNT_ID, dto);

    const [params] = firstCall(stripe.checkout.sessions.create) as [
      Record<string, unknown>,
    ];
    expect(params).toMatchObject({
      mode: 'payment',
      ui_mode: 'embedded_page',
      shipping_address_collection: { allowed_countries: ['US'] },
      permissions: { update_shipping_details: 'server_only' },
      return_url:
        'http://localhost:3002/checkout/return?session_id={CHECKOUT_SESSION_ID}',
      metadata: { accountId: '1', cartToken: 'cart-tok-abc' },
    });
    expect(params.shipping_options).toEqual([
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: 'usd' },
          display_name: 'Calculating…',
        },
      },
    ]);
  });

  it('returns the client secret from the created session', async () => {
    const { service, stripe } = await build({
      db: makeDb([[STRIPE_ACCOUNT_ROW]]),
      getCart: jest.fn().mockResolvedValue(cart()),
    });
    stripe.checkout.sessions.create.mockResolvedValue({
      client_secret: 'cs_test_abc_secret_def',
    });

    await expect(
      service.createSession('cart-tok-abc', ACCOUNT_ID, dto),
    ).resolves.toEqual({ clientSecret: 'cs_test_abc_secret_def' });
  });

  it('rejects when the store has no connected Stripe account', async () => {
    const { service, stripe } = await build({ db: makeDb([[]]) });

    await expect(
      service.createSession('cart-tok-abc', ACCOUNT_ID, dto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('rejects when charges are not enabled on the connected account', async () => {
    const { service } = await build({
      db: makeDb([[{ ...STRIPE_ACCOUNT_ROW, chargesEnabled: false }]]),
    });

    await expect(
      service.createSession('cart-tok-abc', ACCOUNT_ID, dto),
    ).rejects.toThrow("This store isn't ready to accept payments yet");
  });

  it('rejects an empty or missing cart', async () => {
    for (const value of [undefined, cart([])]) {
      const { service } = await build({
        db: makeDb([[STRIPE_ACCOUNT_ROW]]),
        getCart: jest.fn().mockResolvedValue(value),
      });
      await expect(
        service.createSession('cart-tok-abc', ACCOUNT_ID, dto),
      ).rejects.toThrow('Cart is empty');
    }
  });

  it('rejects when a line exceeds available stock', async () => {
    const { service } = await build({
      db: makeDb([[STRIPE_ACCOUNT_ROW]]),
      getCart: jest
        .fn()
        .mockResolvedValue(cart([cartItem({ quantity: 5, stock: 2 })])),
    });

    await expect(
      service.createSession('cart-tok-abc', ACCOUNT_ID, dto),
    ).rejects.toThrow('Not enough stock for Nike Air Force 1');
  });

  it('rejects when Stripe returns a session without a client secret', async () => {
    const { service, stripe } = await build({
      db: makeDb([[STRIPE_ACCOUNT_ROW]]),
      getCart: jest.fn().mockResolvedValue(cart()),
    });
    stripe.checkout.sessions.create.mockResolvedValue({ client_secret: null });

    await expect(
      service.createSession('cart-tok-abc', ACCOUNT_ID, dto),
    ).rejects.toThrow('Failed to create checkout session');
  });
});

describe('CheckoutService.getShippingOptions', () => {
  const dto = {
    checkoutSessionId: 'cs_test_1',
    shippingDetails: {
      name: 'Test Buyer',
      address: {
        line1: '1600 Amphitheatre Parkway',
        city: 'Mountain View',
        state: 'CA',
        postal_code: '94043',
        country: 'US',
      },
    },
  };
  const location = {
    id: 7,
    name: 'Default',
    addressLine1: '2261 Market Street',
    addressLine2: null,
    addressCity: 'San Francisco',
    addressState: 'CA',
    addressPostalCode: '94114',
    addressCountry: 'US',
  };

  function stripeWithSession(): StripeMock {
    const s = newStripeMock();
    s.checkout.sessions.retrieve.mockResolvedValue({
      metadata: { cartToken: 'cart-tok-abc' },
    });
    s.checkout.sessions.update.mockResolvedValue({});
    return s;
  }

  it('quotes the 3 cheapest Shippo rates and records the ship-from location', async () => {
    const stripe = stripeWithSession();
    const shippo: ShippoMock = {
      shipments: {
        create: jest.fn().mockResolvedValue({
          objectId: 'shp_1',
          rates: [
            {
              amount: '12.10',
              provider: 'UPS',
              servicelevel: { name: 'Ground' },
            },
            {
              amount: '5.68',
              provider: 'USPS',
              servicelevel: { name: 'Ground Advantage' },
            },
            {
              amount: '20.00',
              provider: 'FedEx',
              servicelevel: { name: '2Day' },
            },
            {
              amount: '8.37',
              provider: 'USPS',
              servicelevel: { name: 'Priority' },
            },
          ],
        }),
      },
    };
    const { service } = await build({
      db: makeDb([
        [STRIPE_ACCOUNT_ROW],
        [location],
        [{ quantity: 1, weightOz: 32 }],
      ]),
      stripe,
      shippo,
    });

    await expect(service.getShippingOptions(ACCOUNT_ID, dto)).resolves.toEqual({
      ok: true,
    });

    const [sessionId, update, options] = firstCall(
      stripe.checkout.sessions.update,
    ) as [string, Record<string, unknown>, Record<string, unknown>];
    expect(sessionId).toBe('cs_test_1');
    expect(options).toEqual({ stripeAccount: CONNECTED });
    expect(update.shipping_options).toEqual([
      rate(568, 'USPS Ground Advantage'),
      rate(837, 'USPS Priority'),
      rate(1210, 'UPS Ground'),
    ]);
    expect(update.metadata).toMatchObject({ shippingLocationId: '7' });
  });

  it('fails when no location has a shipping-origin address', async () => {
    const shippo: ShippoMock = { shipments: { create: jest.fn() } };
    const { service } = await build({
      db: makeDb([[STRIPE_ACCOUNT_ROW], []]),
      stripe: stripeWithSession(),
      shippo,
    });

    await expect(service.getShippingOptions(ACCOUNT_ID, dto)).resolves.toEqual({
      ok: false,
      errorMessage: "This store hasn't set up a shipping origin yet",
    });
    expect(shippo.shipments.create).not.toHaveBeenCalled();
  });

  it('fails and logs when Shippo returns no rates', async () => {
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const shippo: ShippoMock = {
      shipments: {
        create: jest.fn().mockResolvedValue({
          objectId: 'shp_2',
          rates: [],
          messages: [{ text: 'invalid destination zip' }],
        }),
      },
    };
    const { service } = await build({
      db: makeDb([
        [STRIPE_ACCOUNT_ROW],
        [location],
        [{ quantity: 1, weightOz: 32 }],
      ]),
      stripe: stripeWithSession(),
      shippo,
    });

    await expect(service.getShippingOptions(ACCOUNT_ID, dto)).resolves.toEqual({
      ok: false,
      errorMessage: "We can't calculate shipping to that address",
    });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('invalid destination zip'),
    );
    warn.mockRestore();
  });

  it('fails when the store has no connected Stripe account', async () => {
    const { service } = await build({ db: makeDb([[]]) });

    await expect(service.getShippingOptions(ACCOUNT_ID, dto)).resolves.toEqual({
      ok: false,
      errorMessage: "This store isn't ready to accept payments yet",
    });
  });
});

function rate(amount: number, displayName: string) {
  return {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount, currency: 'usd' },
      display_name: displayName,
    },
  };
}
