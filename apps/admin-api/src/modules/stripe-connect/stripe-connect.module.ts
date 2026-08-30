import { Module } from '@nestjs/common';
import { StripeConnectController } from './stripe-connect.controller';
import { StripeConnectService } from './stripe-connect.service';

@Module({
  controllers: [StripeConnectController],
  providers: [StripeConnectService],
})
export class StripeConnectModule {}
