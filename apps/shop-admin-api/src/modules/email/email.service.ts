import { Injectable, Logger } from '@nestjs/common';
import { createMailer } from 'email';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private readonly mailer = createMailer({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    from: process.env.SMTP_FROM ?? 'Harbor <no-reply@harbor.local>',
  });

  // a staff row is already committed by the time this is called — a
  // delivery failure (e.g. Mailpit not running) shouldn't fail the request
  // that created it, so this swallows and logs instead of throwing
  async sendInviteEmail(to: string, params: { firstName: string; inviteUrl: string }) {
    try {
      await this.mailer.sendMail({
        to,
        subject: "You've been invited to join Harbor",
        html: `
          <p>Hi ${params.firstName},</p>
          <p>You've been added as a user on Harbor. Click below to set your password and get started.</p>
          <p><a href="${params.inviteUrl}">Set your password</a></p>
        `,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to send invite email to ${to}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
