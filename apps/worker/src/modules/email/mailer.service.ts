import { Injectable } from '@nestjs/common';
import { createMailer } from 'email';
import { env } from '../../env';

const FROM = env.SMTP_FROM;

// this app is now the only consumer of `email`'s createMailer — the two
// APIs enqueue jobs instead of talking to SMTP directly
@Injectable()
export class MailerService {
  // auth is only set when SMTP_USER is present — local Mailpit takes no
  // auth, SES SMTP requires it
  private readonly mailer = createMailer({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === 'true',
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? '' }
      : undefined,
  });

  sendMail(params: {
    to: string;
    from?: string | { name: string; address: string };
    subject: string;
    html: string;
  }) {
    return this.mailer.sendMail({ ...params, from: params.from ?? FROM });
  }
}
