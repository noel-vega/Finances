import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'queue';
import { EmailProcessor } from './email.processor';
import { MailerService } from './mailer.service';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.EMAIL })],
  providers: [EmailProcessor, MailerService],
  // exported so HealthModule can query the same singleton instance's
  // isRunning()/lastActiveAt — see EmailProcessor.getLiveness()
  exports: [EmailProcessor],
})
export class EmailModule {}
