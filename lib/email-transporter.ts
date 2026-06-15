import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let cached: Transporter | null = null;

/**
 * Returns a shared Zoho SMTP transporter, or null when SMTP credentials
 * are not configured (so callers can degrade gracefully instead of throwing).
 */
export function getMailer(): Transporter | null {
  if (cached) return cached;
  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASS;
  if (!user || !pass) return null;

  cached = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return cached;
}

export function smtpUser(): string | undefined {
  return process.env.ZOHO_SMTP_USER;
}

type SendMailArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

/**
 * Sends an email if SMTP is configured. Never throws — returns whether it
 * sent, so callers (e.g. webhooks) won't fail on transient mail errors.
 */
export async function sendMail({ to, subject, text, html, replyTo }: SendMailArgs): Promise<boolean> {
  const mailer = getMailer();
  const user = smtpUser();
  if (!mailer || !user) return false;
  try {
    await mailer.sendMail({
      from: `"JMC Solar PH" <${user}>`,
      to,
      replyTo,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error('[sendMail]', err);
    return false;
  }
}
