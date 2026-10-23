import 'server-only';
import { headers } from 'next/headers';
import { db } from './db';
import { hmac } from './tokens';

/** معرّف العميل مجزّأ؛ لا نخزّن عناوين IP كما هي. */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
  return hmac(ip).slice(0, 24);
}

/**
 * حدّ معدل بنافذة ثابتة، مخزّن في قاعدة البيانات ليعمل عبر عدة نسخ من الخادم.
 * يعيد true إذا سُمح بالطلب.
 */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
  const key = `${bucket}:${await clientKey()}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);
  const rows = await db.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart") VALUES (${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" < ${windowStart} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" < ${windowStart} THEN ${now} ELSE "RateLimit"."windowStart" END
    RETURNING "count"`;
  return (rows[0]?.count ?? 0) <= limit;
}
