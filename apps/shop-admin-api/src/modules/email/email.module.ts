import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_JOB_OPTIONS, QUEUE_NAMES } from 'queue';
import { EmailService } from './email.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMAIL,
      defaultJobOptions: EMAIL_JOB_OPTIONS,
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
