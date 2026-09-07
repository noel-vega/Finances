import { Injectable } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { DomainEventBus, OnDomainEvent } from './domain-event-bus';
import { DOMAIN_EVENTS, type CheckoutSessionPaidPayload } from './events';

@Injectable()
class Listener {
  readonly received: CheckoutSessionPaidPayload[] = [];

  @OnDomainEvent(DOMAIN_EVENTS.CHECKOUT_SESSION_PAID)
  handle(payload: CheckoutSessionPaidPayload) {
    this.received.push(payload);
  }
}

describe('DomainEventBus', () => {
  it('delivers a typed domain event to an @OnDomainEvent handler in-process', async () => {
    const ref = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [DomainEventBus, Listener],
    }).compile();
    await ref.init();

    const bus = ref.get(DomainEventBus);
    const listener = ref.get(Listener);

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

    bus.emit(DOMAIN_EVENTS.CHECKOUT_SESSION_PAID, payload);

    expect(listener.received).toEqual([payload]);
  });
});
