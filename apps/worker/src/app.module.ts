import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { createRedisConnection } from 'queue';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './modules/email/email.module';
import { OrdersModule } from './modules/orders/orders.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    BullModule.forRoot({ connection: createRedisConnection() }),
    DatabaseModule,
    EmailModule,
    OrdersModule,
    HealthModule,
  ],
})
export class AppModule {}
