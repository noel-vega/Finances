import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import type Stripe from 'stripe';
import { createStripeClient } from 'payments';
import { Shippo } from 'shippo';
import { ORDER_JOB_OPTIONS, QUEUE_NAMES } from 'queue';
import { env } from '../../env';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { SHIPPO, STRIPE } from './checkout.constants';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    CartModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.ORDERS,
      defaultJobOptions: ORDER_JOB_OPTIONS,
    }),
  ],
  controllers: [CheckoutController],
  providers: [
    CheckoutService,
    {
      // platform's own secret key — sessions are created directly on a
      // merchant's connected account via the `stripeAccount` request option,
      // so funds never touch the platform. Version pin + timeouts live in
      // `packages/payments`.
      provide: STRIPE,
      useFactory: (): Stripe => createStripeClient(env.STRIPE_SECRET_KEY),
    },
    {
      // one platform-owned key for every merchant, unlike Stripe where each
      // merchant connects their own account
      provide: SHIPPO,
      useFactory: (): Shippo =>
        new Shippo({ apiKeyHeader: env.SHIPPO_API_KEY, timeoutMs: 20_000 }),
    },
  ],
})
export class CheckoutModule {}
