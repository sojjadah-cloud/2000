import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, CheckCircle2, Clock, Hourglass, MapPin, XCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { getT, pick } from '@/lib/i18n/server';
import { hashToken } from '@/lib/tokens';
import { formatTimeRange, formatWeekdayDate } from '@/lib/dates';
import { cancelRegistration } from '@/lib/actions/events';
import { Arrow } from '@/components/site/Arrow';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> };

/** صفحة التسجيل الخاصة: تظهر فقط لمن يملك الرابط (الرمز مخزّن مجزّأً). */
export default async function RegistrationPage({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  const { t, lang } = await getT();
  const tx = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const reg = await db.eventRegistration.findUnique({
    where: { manageTokenHash: hashToken(token) },
    include: { event: { select: { slug: true, title: true, titleEn: true, startsAt: true, endsAt: true, timezone: true, venue: true, venueEn: true, instructions: true } } },
  });
  if (!reg) notFound();
  const ev = reg.event;
  const ended = ev.endsAt < new Date();
  const Icon = reg.status === 'CONFIRMED' ? CheckCircle2 : reg.status === 'WAITLIST' ? Hourglass : XCircle;
  const heading =
    reg.status === 'CONFIRMED' ? tx('تم تأكيد تسجيلك', 'Your registration is confirmed') : reg.status === 'WAITLIST' ? tx('أنت في قائمة الانتظار', "You're on the waitlist") : tx('تم إلغاء التسجيل', 'Registration cancelled');

  return (
    <div className="container-site max-w-2xl py-12 md:py-16">
      <div className="border border-line bg-white p-6 text-center sm:p-10">
        <Icon aria-hidden size={52} className={`mx-auto ${reg.status === 'CONFIRMED' ? 'text-[#1f8f5f]' : reg.status === 'WAITLIST' ? 'text-orange' : 'text-burgundy'}`} />
        <h1 className="mt-4 text-h2 font-bold text-navy">{heading}</h1>
        {sp.new && reg.status !== 'CANCELLED' && (
          <p role="status" className="mt-3 text-ink-muted">
            {sp.noemail ? t('events.reg.doneNoEmail') : reg.status === 'WAITLIST' ? t('events.reg.waitlisted') : t('events.reg.done')}
          </p>
        )}
        {sp.noemail && (
          <p className="mt-2 text-sm text-ink-soft">{tx('احفظ رابط هذه الصفحة لإدارة تسجيلك.', 'Bookmark this page to manage your registration.')}</p>
        )}

        <div className="mt-8 rounded bg-[#faf9f9] p-5 text-start">
          <p className="text-lg font-bold text-navy">{pick(lang, ev.title, ev.titleEn).text}</p>
          <ul className="mt-3 space-y-2 text-[0.95rem] text-navy">
            <li className="flex items-center gap-2">
              <CalendarDays aria-hidden size={17} className="text-orange" /> {formatWeekdayDate(ev.startsAt, lang, ev.timezone)}
            </li>
            <li className="flex items-center gap-2">
              <Clock aria-hidden size={17} className="text-orange" /> <span className="ltr-iso">{formatTimeRange(ev.startsAt, ev.endsAt, lang, ev.timezone)}</span> ({t('events.timezone')})
            </li>
            {ev.venue && (
              <li className="flex items-center gap-2">
                <MapPin aria-hidden size={17} className="text-orange" /> {pick(lang, ev.venue, ev.venueEn).text}
              </li>
            )}
          </ul>
          <p className="mt-3 text-sm text-ink-muted">
            {tx('باسم', 'Name')}: <b className="text-navy">{reg.name}</b> · <span className="ltr-iso">{reg.email}</span>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/events/${ev.slug}`} className="btn btn-outline">
            {t('events.details')} <Arrow />
          </Link>
          {reg.status !== 'CANCELLED' && !ended && (
            <form action={cancelRegistration}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn border-burgundy text-burgundy hover:bg-burgundy hover:text-white">
                {tx('إلغاء التسجيل', 'Cancel registration')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
