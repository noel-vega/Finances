import { Injectable, Logger } from '@nestjs/common';
import { createMailer } from 'email';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private readonly mailer = createMailer({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
  });

  // the customer's relationship is with the shop they signed up at, not
  // with the platform — sent as that shop, not as "Harbor". A signup row is
  // already committed by the time this is called, so a delivery failure
  // (e.g. Mailpit not running) shouldn't fail the request — swallow + log.
  async sendThankYouEmail(to: string, params: { firstName: string; accountName: string }) {
    const storefrontUrl = process.env.STOREFRONT_WEB_URL ?? 'http://localhost:3002';

    try {
      await this.mailer.sendMail({
        to,
        from: { name: params.accountName, address: 'no-reply@harbor.local' },
        subject: `Thanks for signing up, ${params.firstName}!`,
        html: `
          <p>Hi ${params.firstName},</p>
          <p>Thanks for creating an account with ${params.accountName}. We're glad you're here.</p>
          <p><a href="${storefrontUrl}/products">Start shopping</a></p>
        `,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to send thank-you email to ${to}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
