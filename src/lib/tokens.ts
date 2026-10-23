import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** الرموز تُخزَّن مجزّأة؛ تسرب قاعدة البيانات لا يكشف روابط المتابعة. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hmac(value: string): string {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error('APP_SECRET غير مضبوط');
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function appUrl(path: string): string {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return base + path;
}
