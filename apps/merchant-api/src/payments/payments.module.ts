import { Module } from '@nestjs/common';
import { StripeConnectController } from './stripe-connect.controller';
import { StripeConnectService } from './stripe-connect.service';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  controllers: [StripeConnectController, StripeWebhookController],
  providers: [StripeConnectService],
})
export class PaymentsModule {}
