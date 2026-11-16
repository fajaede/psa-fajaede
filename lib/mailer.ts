import nodemailer from "nodemailer";

/** SMTP transport from SMTP_* env vars; throws when they are missing. */
export function createMailer() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim();
  if (!host || !user || !pass || !from) {
    throw new Error("SMTP_HOST, SMTP_FROM, SMTP_USER and SMTP_PASS are required.");
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  return { from, transport: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }) };
}
