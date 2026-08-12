import nodemailer from "nodemailer";

export interface MailerConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: { user: string; pass: string };
  from: string;
}

export interface SendMailParams {
  to: string;
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
        from: config.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
  };
}
