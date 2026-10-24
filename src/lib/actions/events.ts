'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getLang } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/dict';
import { rateLimit } from '@/lib/rate-limit';
import { registrationState } from '@/lib/events';
import { publicWhere } from '@/lib/publish';
import { appUrl, hashToken, randomToken } from '@/lib/tokens';
import { emailLayout, escapeHtml, sendEmail } from '@/lib/email';
import { formatTimeRange, formatWeekdayDate } from '@/lib/dates';
import { plain } from '@/lib/sanitize';
import type { FormState } from './public';

const schema = z.object({
  eventId: z.string().min(1).max(40),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
});

class RegError extends Error {
  constructor(public code: 'closed' | 'full' | 'duplicate') {
    super(code);
  }
}

/**
 * تسجيل الحضور. يقفل صف الفعالية داخل معاملة (SELECT … FOR UPDATE)
 * فلا تتجاوز التسجيلات المتزامنة السعة.
 */
export async function registerForEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const lang = await getLang();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const raw = { eventId: String(formData.get('eventId') ?? ''), name: String(formData.get('name') ?? ''), email: String(formData.get('email') ?? '') };
  if (formData.get('website')) return { ok: false, message: t('error.generic') };
  if (!(await rateLimit('event-register', 8, 600))) return { ok: false, message: t('error.rateLimit'), data: raw };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0]);
      errors[k] = k === 'email' ? t('error.invalidEmail') : lang === 'ar' ? 'أدخل اسمك (حرفان على الأقل).' : 'Enter your name.';
    }
    return { ok: false, errors, data: raw };
  }
  const { eventId, name, email } = parsed.data;
  const token = randomToken();

  let result: { status: 'CONFIRMED' | 'WAITLIST'; event: { slug: string; title: string; titleEn: string | null; startsAt: Date; endsAt: Date; timezone: string; venue: string | null } };
  try {
    result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
      const event = await tx.event.findFirst({ where: { id: eventId, ...publicWhere() } });
      if (!event) throw new RegError('closed');
      const confirmed = await tx.eventRegistration.count({ where: { eventId, status: 'CONFIRMED' } });
      const state = registrationState(event, confirmed);
      if (state !== 'OPEN' && state !== 'WAITLIST') throw new RegError(state === 'FULL' ? 'full' : 'closed');
      const existing = await tx.eventRegistration.findUnique({ where: { eventId_email: { eventId, email } } });
      if (existing && existing.status !== 'CANCELLED') throw new RegError('duplicate');
      const status = state === 'OPEN' ? 'CONFIRMED' : 'WAITLIST';
      if (existing) {
        await tx.eventRegistration.update({ where: { id: existing.id }, data: { name: plain(name), status, manageTokenHash: hashToken(token), createdAt: new Date() } });
      } else {
        await tx.eventRegistration.create({ data: { eventId, name: plain(name), email, status, manageTokenHash: hashToken(token) } });
      }
      return { status, event };
    });
  } catch (e) {
    if (e instanceof RegError) {
      const msg = e.code === 'duplicate' ? t('events.reg.duplicate') : e.code === 'full' ? t('events.reg.full') : t('events.reg.closed');
      return { ok: false, message: msg, data: raw };
    }
    throw e;
  }

  const ev = result.event;
  const title = lang === 'en' && ev.titleEn ? ev.titleEn : ev.title;
  const manageUrl = appUrl(`/events/registration/${token}`);
  const sent = await sendEmail({
    to: email,
    purpose: 'event-registration',
    subject: result.status === 'CONFIRMED' ? `تأكيد التسجيل: ${title}` : `قائمة الانتظار: ${title}`,
    html: emailLayout(
      result.status === 'CONFIRMED' ? 'تم تسجيلك' : 'أُضفت إلى قائمة الانتظار',
      `<p>${escapeHtml(name)}، ${result.status === 'CONFIRMED' ? 'نؤكد تسجيلك في' : 'أنت في قائمة الانتظار لـ'} <b>${escapeHtml(title)}</b>.</p>
       <p>${formatWeekdayDate(ev.startsAt, 'ar', ev.timezone)} — ${formatTimeRange(ev.startsAt, ev.endsAt, 'ar', ev.timezone)} (بتوقيت مسقط)${ev.venue ? `<br>${escapeHtml(ev.venue)}` : ''}</p>
       <p>لعرض تسجيلك أو إلغائه: <a href="${manageUrl}">إدارة التسجيل</a></p>`,
    ),
  });
  revalidatePath(`/events/${ev.slug}`);
  redirect(`/events/registration/${token}?new=1${sent ? '' : '&noemail=1'}`);
}

/** إلغاء التسجيل برابط الإدارة؛ يرقّي أول المنتظرين عند تحرر مقعد. */
export async function cancelRegistration(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  if (!token) return;
  await db.$transaction(async (tx) => {
    const reg = await tx.eventRegistration.findUnique({ where: { manageTokenHash: hashToken(token) } });
    if (!reg || reg.status === 'CANCELLED') return;
    await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${reg.eventId} FOR UPDATE`;
    await tx.eventRegistration.update({ where: { id: reg.id }, data: { status: 'CANCELLED' } });
    if (reg.status === 'CONFIRMED') {
      const next = await tx.eventRegistration.findFirst({ where: { eventId: reg.eventId, status: 'WAITLIST' }, orderBy: { createdAt: 'asc' } });
      if (next) await tx.eventRegistration.update({ where: { id: next.id }, data: { status: 'CONFIRMED' } });
    }
  });
  redirect(`/events/registration/${token}?cancelled=1`);
}
