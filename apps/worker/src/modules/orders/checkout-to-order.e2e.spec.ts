import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import type { Job } from 'bullmq';
import { QUEUE_NAMES, type OrderJobData } from 'queue';
import {
  assertCanonicalOrderWritten,
  canonicalOrderJobData,
  seedCheckoutScenario,
  useTestDb,
} from 'test-support';
import { DRIZZLE } from '../../database/database.constants';
import { OrdersProcessor } from './orders.processor';

// M9 regression anchor — the consumer half of the checkout→order path.
// Pinned to the same canonical scenario as the producer contract test in
// apps/storefront-api (checkout.service.spec.ts). When M9 moves the producer
// from storefront-api CheckoutService to merchant-api sales, this spec is
// untouched — it proves the order the worker writes stays byte-identical.
const db = useTestDb();

describe('checkout → order end-to-end (M9 regression anchor)', () => {
  it('writes the canonical order from the canonical checkout-completed payload', async () => {
    const scenario = await seedCheckoutScenario(db);
    const emailQueue = { add: jest.fn() };

    const ref = await Test.createTestingModule({
      providers: [
        OrdersProcessor,
        { provide: DRIZZLE, useValue: db },
        { provide: getQueueToken(QUEUE_NAMES.EMAIL), useValue: emailQueue },
      ],
    }).compile();
    const processor = ref.get(OrdersProcessor);

    const payload: OrderJobData = canonicalOrderJobData(scenario);
    await processor.process({ data: payload } as unknown as Job<OrderJobData>);

    await assertCanonicalOrderWritten(db, scenario);
    expect(emailQueue.add).toHaveBeenCalledTimes(1);
  });
});
