import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { createRedisConnection } from 'queue';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    BullModule.forRoot({ connection: createRedisConnection() }),
    EmailModule,
  ],
})
export class AppModule {}
