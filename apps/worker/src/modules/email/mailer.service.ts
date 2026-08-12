import { Injectable } from '@nestjs/common';
import { createMailer } from 'email';

const FROM = process.env.SMTP_FROM ?? 'Harbor <no-reply@harbor.local>';

// this app is now the only consumer of `email`'s createMailer — the two
// APIs enqueue jobs instead of talking to SMTP directly
@Injectable()
export class MailerService {
  private readonly mailer = createMailer({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
  });

  sendMail(params: { to: string; from?: string | { name: string; address: string }; subject: string; html: string }) {
    return this.mailer.sendMail({ ...params, from: params.from ?? FROM });
  }
}
