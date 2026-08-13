import { Module } from '@nestjs/common';
import { FulfillmentsController } from './fulfillments.controller';
import { FulfillmentsService } from './fulfillments.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [FulfillmentsController],
  providers: [FulfillmentsService],
})
export class FulfillmentsModule {}
