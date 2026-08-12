import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QUEUE_NAMES, type EmailJobData } from 'queue';
import { MailerService } from './mailer.service';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

// every field below comes from the checkout form (or, for accountName, an
// account's own signup) — none of it is safe to drop into an HTML template
// unescaped, whether it lands in a text node or an href="..." attribute
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]!);
}

// this is the only place email HTML gets built now — moved here verbatim
// from shop-admin-api's/storefront-api's EmailService
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
          html: `
            <p>Hi ${escapeHtml(data.firstName)},</p>
            <p>You've been added as a user on Harbor. Click below to set your password and get started.</p>
            <p><a href="${escapeHtml(data.inviteUrl)}">Set your password</a></p>
          `,
        });
        return;

      // the customer's relationship is with the shop they signed up at, not
      // with the platform — sent as that shop, not as "Harbor"
      case 'customer-thank-you':
        await this.mailerService.sendMail({
          to: data.to,
          from: { name: data.accountName, address: 'no-reply@harbor.local' },
          subject: `Thanks for signing up, ${data.firstName}!`,
          html: `
            <p>Hi ${escapeHtml(data.firstName)},</p>
            <p>Thanks for creating an account with ${escapeHtml(data.accountName)}. We're glad you're here.</p>
            <p><a href="${escapeHtml(data.storefrontUrl)}/products">Start shopping</a></p>
          `,
        });
        return;

      // same reasoning as customer-thank-you: sent as the shop the
      // customer bought from, not as "Harbor"
      case 'order-confirmation': {
        const itemRows = data.items
          .map(
            (item) => `
            <tr>
              <td style="padding: 8px 0;">
                ${escapeHtml(item.productName)}${item.optionsLabel ? ` <span style="color: #666;">(${escapeHtml(item.optionsLabel)})</span>` : ''}
                <br /><span style="color: #666; font-size: 0.9em;">Qty ${item.quantity}</span>
              </td>
              <td style="padding: 8px 0; text-align: right;">${formatCents(item.priceCents * item.quantity)}</td>
            </tr>`,
          )
          .join('');

        const addressLines = [
          data.shippingLine1,
          data.shippingLine2,
          [data.shippingCity, data.shippingState, data.shippingPostalCode].filter(Boolean).join(', '),
          data.shippingCountry,
        ]
          .filter(Boolean)
          .map((line) => escapeHtml(line!));

        await this.mailerService.sendMail({
          to: data.to,
          from: { name: data.accountName, address: 'no-reply@harbor.local' },
          subject: `Your order from ${data.accountName} is confirmed (#${data.orderId})`,
          html: `
            <p>Hi ${escapeHtml(data.customerName)},</p>
            <p>Thanks for your order from ${escapeHtml(data.accountName)}! Here's a summary of order #${data.orderId}.</p>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemRows}
              <tr>
                <td style="padding: 8px 0; border-top: 1px solid #ddd;">Subtotal</td>
                <td style="padding: 8px 0; border-top: 1px solid #ddd; text-align: right;">${formatCents(data.subtotalCents)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">Shipping</td>
                <td style="padding: 8px 0; text-align: right;">${formatCents(data.shippingCents)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Total</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCents(data.amountTotalCents)}</td>
              </tr>
            </table>
            <p>Shipping to:<br />${addressLines.join('<br />')}</p>
            <p><a href="${escapeHtml(data.storefrontUrl)}/products">Continue shopping</a></p>
          `,
        });
        return;
      }

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
