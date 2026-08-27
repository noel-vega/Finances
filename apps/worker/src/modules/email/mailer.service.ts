import { Injectable } from '@nestjs/common';
import { createMailer } from 'email';

const FROM = process.env.SMTP_FROM ?? 'Ordersail <no-reply@ordersail.local>';

// this app is now the only consumer of `email`'s createMailer — the two
// APIs enqueue jobs instead of talking to SMTP directly
@Injectable()
export class MailerService {
  // auth is only set when SMTP_USER is present — local Mailpit takes no
  // auth, SES SMTP requires it
  private readonly mailer = createMailer({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS! }
      : undefined,
  });

  sendMail(params: { to: string; from?: string | { name: string; address: string }; subject: string; html: string }) {
    return this.mailer.sendMail({ ...params, from: params.from ?? FROM });
  }
}
