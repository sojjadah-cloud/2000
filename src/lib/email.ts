import 'server-only';
import nodemailer from 'nodemailer';
import { db } from './db';

// خدمة البريد: SMTP عند ضبطه، وإلا تُسجَّل الرسالة بحالة NOT_CONFIGURED
// ويعيد send قيمة false لتُبلغ الواجهة المستخدم بصدق أن الرسالة لم تُرسل.

export function emailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
  }
  return transport;
}

export async function sendEmail(opts: { to: string; subject: string; html: string; purpose: string }): Promise<boolean> {
  if (!emailConfigured()) {
    await db.emailOutbox.create({ data: { ...opts, status: 'NOT_CONFIGURED' } });
    return false;
  }
  try {
    await getTransport().sendMail({ from: process.env.SMTP_FROM, to: opts.to, subject: opts.subject, html: opts.html });
    await db.emailOutbox.create({ data: { ...opts, status: 'SENT' } });
    return true;
  } catch (err) {
    // لا نسجّل محتوى الرسالة أو بيانات الاعتماد في سجلات الخادم
    await db.emailOutbox.create({ data: { ...opts, status: 'FAILED', error: (err as Error).message.slice(0, 300) } });
    return false;
  }
}

export async function notifyTeam(subject: string, html: string, purpose: string) {
  const to = process.env.TEAM_NOTIFY_EMAIL;
  if (!to) return false;
  return sendEmail({ to, subject, html, purpose });
}

export function emailLayout(title: string, body: string): string {
  return `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f6f6f4;font-family:Tahoma,Arial,sans-serif;color:#0D142F">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
  <div style="font-size:22px;font-weight:bold;margin-bottom:16px">ألفين | TWO THOUSAND</div>
  <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
  <div style="font-size:15px;line-height:1.9">${body}</div>
  </div></body></html>`;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
