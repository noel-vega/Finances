import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QUEUE_NAMES, type EmailJobData } from 'queue';
import {
  renderCustomerThankYouEmail,
  renderOrderConfirmationEmail,
  renderStaffInviteEmail,
} from 'email-templates';
import { MailerService } from './mailer.service';

// this is the only place email HTML gets built now — moved here verbatim
// from shop-admin-api's/storefront-api's EmailService. The HTML itself is
// built by the `email-templates` package (React components rendered to a
// string via react-email) — this file just maps a job's data onto template
// props and sends the result
@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailerService: MailerService) {
    super();
  }

  // errors are intentionally left to propagate — BullMQ marks the job
  // failed and retries per queue.EMAIL_JOB_OPTIONS's backoff, instead of the
  // old inline try/catch that logged and gave up after one attempt
  async process(job: Job<EmailJobData>): Promise<void> {
    const data = job.data;

    switch (data.type) {
      case 'staff-invite':
        await this.mailerService.sendMail({
          to: data.to,
          subject: "You've been invited to join Harbor",
          html: await renderStaffInviteEmail({ firstName: data.firstName, inviteUrl: data.inviteUrl }),
        });
        return;

      // the customer's relationship is with the shop they signed up at, not
      // with the platform — sent as that shop, not as "Harbor"
      case 'customer-thank-you':
        await this.mailerService.sendMail({
          to: data.to,
          from: { name: data.accountName, address: 'no-reply@harbor.local' },
          subject: `Thanks for signing up, ${data.firstName}!`,
          html: await renderCustomerThankYouEmail({
            firstName: data.firstName,
            accountName: data.accountName,
            storefrontUrl: data.storefrontUrl,
          }),
        });
        return;

      // same reasoning as customer-thank-you: sent as the shop the
      // customer bought from, not as "Harbor"
      case 'order-confirmation':
        await this.mailerService.sendMail({
          to: data.to,
          from: { name: data.accountName, address: 'no-reply@harbor.local' },
          subject: `Your order from ${data.accountName} is confirmed (#${data.orderId})`,
          html: await renderOrderConfirmationEmail({
            customerName: data.customerName,
            accountName: data.accountName,
            orderId: data.orderId,
            items: data.items,
            subtotalCents: data.subtotalCents,
            shippingCents: data.shippingCents,
            amountTotalCents: data.amountTotalCents,
            shippingLine1: data.shippingLine1,
            shippingLine2: data.shippingLine2,
            shippingCity: data.shippingCity,
            shippingState: data.shippingState,
            shippingPostalCode: data.shippingPostalCode,
            shippingCountry: data.shippingCountry,
            storefrontUrl: data.storefrontUrl,
          }),
        });
        return;

      default: {
        // compile-time exhaustiveness check: adding a new EmailJobData
        // union member without a case here fails the build, not just the
        // job at runtime
        const _exhaustive: never = data;
        throw new Error(`Unrecognized email job type: ${(_exhaustive as EmailJobData).type}`);
      }
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailJobData>, err: Error) {
    this.logger.warn(
      `Job ${job.id} (${job.name}) failed on attempt ${job.attemptsMade}: ${err.message}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<EmailJobData>) {
    this.logger.log(`Job ${job.id} (${job.name}) sent to ${job.data.to}`);
  }
}
