import { Module } from '@nestjs/common';
import { StripeConnectController } from './stripe-connect.controller';
import { StripeConnectService } from './stripe-connect.service';
import { CheckoutWebhookController } from './checkout-webhook.controller';

@Module({
  controllers: [StripeConnectController, CheckoutWebhookController],
  providers: [StripeConnectService],
})
export class PaymentsModule {}
