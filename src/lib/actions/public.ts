'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { LANG_COOKIE, getLang } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/dict';
import { rateLimit } from '@/lib/rate-limit';
import { hashToken, randomToken, appUrl } from '@/lib/tokens';
import { emailLayout, escapeHtml, notifyTeam, sendEmail } from '@/lib/email';
import { plain } from '@/lib/sanitize';

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string>; data?: Record<string, string> };

export async function setLanguage(formData: FormData) {
  const lang = formData.get('lang') === 'en' ? 'en' : 'ar';
  const back = String(formData.get('back') || '/');
  const store = await cookies();
  store.set(LANG_COOKIE, lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  // نقبل المسارات الداخلية فقط
  redirect(back.startsWith('/') && !back.startsWith('//') ? back : '/');
}

const emailSchema = z.string().trim().toLowerCase().email().max(254);

// ───────── النشرة ─────────

export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  const lang = await getLang();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  // حقل مخفي لاصطياد البرامج الآلية
  if (formData.get('website')) return { ok: true, message: t('newsletter.pending') };
  if (!(await rateLimit('subscribe', 5, 600))) return { ok: false, message: t('error.rateLimit') };

  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) return { ok: false, errors: { email: t('error.invalidEmail') } };
  const email = parsed.data;

  const existing = await db.subscriber.findUnique({ where: { email } });
  if (existing?.status === 'CONFIRMED') return { ok: true, message: t('newsletter.already') };

  const confirmToken = randomToken();
  const manageToken = randomToken();
  await db.subscriber.upsert({
    where: { email },
    create: { email, lang, confirmTokenHash: hashToken(confirmToken), manageTokenHash: hashToken(manageToken) },
    update: { status: 'PENDING', lang, confirmTokenHash: hashToken(confirmToken), manageTokenHash: hashToken(manageToken), unsubscribedAt: null },
  });

  const sent = await sendEmail({
    to: email,
    purpose: 'newsletter-confirm',
    subject: 'أكّد اشتراكك في نشرة ألفين',
    html: emailLayout(
      'أكّد اشتراكك',
      `<p>اضغط الرابط التالي لتأكيد اشتراكك في نشرة ألفين:</p>
       <p><a href="${appUrl(`/newsletter/confirm/${confirmToken}`)}">تأكيد الاشتراك</a></p>
       <p style="color:#6b7084;font-size:13px">إن لم تطلب الاشتراك فتجاهل هذه الرسالة. لإدارة اشتراكك لاحقًا:
       <a href="${appUrl(`/newsletter/manage/${manageToken}`)}">إدارة الاشتراك</a></p>`,
    ),
  });
  return { ok: true, message: sent ? t('newsletter.pending') : t('newsletter.noEmail') };
}

// ───────── تواصل معنا ─────────

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  kind: z.enum(['general', 'collab', 'media', 'submission', 'other']),
  message: z.string().trim().min(10).max(5000),
});

export async function sendContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const lang = await getLang();
  const ar = lang === 'ar';
  const raw = Object.fromEntries(['name', 'email', 'kind', 'message'].map((k) => [k, String(formData.get(k) ?? '')]));
  if (formData.get('website')) return { ok: true, message: translate(lang, 'contact.sent') };
  if (!(await rateLimit('contact', 5, 900))) return { ok: false, message: translate(lang, 'error.rateLimit'), data: raw };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0]);
      errors[k] =
        k === 'email' ? translate(lang, 'error.invalidEmail')
        : k === 'name' ? (ar ? 'أدخل اسمك (حرفان على الأقل).' : 'Enter your name.')
        : k === 'message' ? (ar ? 'اكتب رسالة من 10 أحرف على الأقل.' : 'Write at least 10 characters.')
        : ar ? 'اختر نوع الاستفسار.' : 'Choose an enquiry type.';
    }
    return { ok: false, errors, data: raw };
  }
  const { name, email, kind, message } = parsed.data;
  await db.contactMessage.create({ data: { name: plain(name), email, kind, message: plain(message) } });
  await notifyTeam(
    `رسالة جديدة: ${name}`,
    emailLayout('رسالة جديدة من نموذج التواصل', `<p><b>${escapeHtml(name)}</b> — ${escapeHtml(email)}</p><p>${escapeHtml(message)}</p>`),
    'contact-notify',
  );
  return { ok: true, message: translate(lang, 'contact.sent') };
}
