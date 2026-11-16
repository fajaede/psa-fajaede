import nodemailer from "nodemailer";
import { Resend } from "resend";

export type MailAttachment = { filename: string; content: string | Buffer; contentType?: string };
export type OutgoingMail = { to: string; subject: string; text: string; attachments?: MailAttachment[] };

/**
 * Sends an app email (login links, accounting report, alerts).
 * Uses Resend when RESEND_API_KEY is set (Vercel Marketplace integration, domain
 * RESEND_EMAIL_DOMAIN, e.g. mail.fajaede.nl); otherwise falls back to SMTP_*.
 * Replies go to MAIL_REPLY_TO, or SMTP_FROM (info@fajaede.nl).
 */
export async function sendMail(mail: OutgoingMail): Promise<void> {
  const replyTo = process.env.MAIL_REPLY_TO?.trim() || process.env.SMTP_FROM?.trim() || undefined;
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (resendKey) {
    const domain = process.env.RESEND_EMAIL_DOMAIN?.trim();
    const from = process.env.MAIL_FROM?.trim() || (domain ? `PSA <noreply@${domain}>` : "");
    if (!from) throw new Error("MAIL_FROM or RESEND_EMAIL_DOMAIN is required to send with Resend.");

    const { error } = await new Resend(resendKey).emails.send({
      from,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      replyTo,
      attachments: mail.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
    });
    if (error) throw new Error(`Resend: ${error.name ?? "error"}: ${error.message}`);
    return;
  }

  const { from, transport } = createSmtpMailer();
  await transport.sendMail({ from, to: mail.to, subject: mail.subject, text: mail.text, replyTo, attachments: mail.attachments });
}

/** SMTP transport from SMTP_* env vars; throws when they are missing. */
function createSmtpMailer() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim();
  if (!host || !user || !pass || !from) {
    throw new Error("Set RESEND_API_KEY, or SMTP_HOST, SMTP_FROM, SMTP_USER and SMTP_PASS.");
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  return { from, transport: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }) };
}
