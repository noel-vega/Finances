import { Injectable } from '@nestjs/common';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { Logger } from 'logging';

export interface CriticalAlert {
  // SNS truncates Subject at 100 chars and rejects newlines — kept short and
  // single-line by callers; this service defensively clamps it anyway
  subject: string;
  message: string;
}

// Out-of-band pager for failures the app can't recover from on its own. The
// SNS topic (ordersail-alerts-critical, OS-80) fans out to email today, SMS
// later. With no topic ARN configured — local dev, tests, CI — every method
// is a no-op: the [alert]-shaped log line stays the only channel.
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private readonly topicArn = process.env.ALERTS_CRITICAL_TOPIC_ARN;
  // region comes from the task's AWS_REGION / execution-role env in ECS
  private readonly sns = this.topicArn ? new SNSClient({}) : null;

  get enabled(): boolean {
    return this.sns !== null;
  }

  // deliberately swallows its own errors — a paging failure must never turn
  // into an unhandled rejection in a BullMQ worker-event handler, and the
  // caller has already written a durable record + log line before calling us
  async publishCritical(alert: CriticalAlert): Promise<void> {
    if (!this.sns || !this.topicArn) return;

    try {
      await this.sns.send(
        new PublishCommand({
          TopicArn: this.topicArn,
          Subject: alert.subject.replace(/\s+/g, ' ').trim().slice(0, 100),
          Message: alert.message,
        }),
      );
    } catch (err) {
      this.logger.error(
        `Failed to publish critical alert to SNS: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
