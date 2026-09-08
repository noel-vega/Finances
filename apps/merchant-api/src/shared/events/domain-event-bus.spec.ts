import { Injectable } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { DomainEventBus, OnDomainEvent } from './domain-event-bus';
import { DOMAIN_EVENTS, type CheckoutSessionPaidPayload } from './events';

@Injectable()
class Listener {
  readonly received: CheckoutSessionPaidPayload[] = [];
  shouldThrow = false;

  @OnDomainEvent(DOMAIN_EVENTS.CHECKOUT_SESSION_PAID)
  async handle(payload: CheckoutSessionPaidPayload) {
    await Promise.resolve();
    if (this.shouldThrow) throw new Error('handler failed');
    this.received.push(payload);
  }
}

const payload: CheckoutSessionPaidPayload = {
  accountId: 1,
  cartToken: 'cart-tok-abc',
  checkoutSessionId: 'cs_test_1',
  paymentIntentId: 'pi_test_1',
  customerEmail: 'buyer@test.com',
  customerName: 'Test Buyer',
  amountTotalCents: 12345,
  shippingAmountCents: 845,
  shippingLocationId: 7,
  shippingAddress: {
    name: 'Test Buyer',
    line1: '1 Market St',
    line2: null,
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'US',
  },
};

async function build() {
  const ref = await Test.createTestingModule({
    imports: [EventEmitterModule.forRoot()],
    providers: [DomainEventBus, Listener],
  }).compile();
  await ref.init();
  return { bus: ref.get(DomainEventBus), listener: ref.get(Listener) };
}

describe('DomainEventBus', () => {
  it('emitAsync delivers a typed domain event to an @OnDomainEvent handler and awaits it', async () => {
    const { bus, listener } = await build();

    await bus.emitAsync(DOMAIN_EVENTS.CHECKOUT_SESSION_PAID, payload);

    expect(listener.received).toEqual([payload]);
  });

  it('emitAsync rejects when a handler rejects', async () => {
    const { bus, listener } = await build();
    listener.shouldThrow = true;

    await expect(
      bus.emitAsync(DOMAIN_EVENTS.CHECKOUT_SESSION_PAID, payload),
    ).rejects.toThrow('handler failed');
    expect(listener.received).toEqual([]);
  });

  it('emit does not await the handler', async () => {
    const { bus, listener } = await build();

    bus.emit(DOMAIN_EVENTS.CHECKOUT_SESSION_PAID, payload);
    expect(listener.received).toEqual([]); // async handler hasn't resolved yet
  });
});
