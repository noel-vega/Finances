import nodemailer from "nodemailer";

export interface MailerConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: { user: string; pass: string };
}

export interface SendMailParams {
  to: string;
  // per-send, not baked into the mailer config — different emails from the
  // same app can need different senders (e.g. a platform-branded email vs.
  // one sent on behalf of a specific merchant). Object form lets nodemailer
  // handle quoting/escaping a display name that comes from user data (e.g.
  // a shop's own name) instead of hand-building a "Name <addr>" string.
  from: string | { name: string; address: string };
  subject: string;
  html: string;
}

export function createMailer(config: MailerConfig) {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure ?? false,
    auth: config.auth,
  });

  return {
    sendMail: (params: SendMailParams) =>
      transport.sendMail({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
  };
}
