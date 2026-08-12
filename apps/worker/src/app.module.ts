import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { createRedisConnection } from 'queue';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './modules/email/email.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    BullModule.forRoot({ connection: createRedisConnection() }),
    DatabaseModule,
    EmailModule,
    OrdersModule,
  ],
})
export class AppModule {}
