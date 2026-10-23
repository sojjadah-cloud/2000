import type { Lang } from './i18n/dict';

export const MUSCAT_TZ = 'Asia/Muscat';

const locale = (lang: Lang) => (lang === 'ar' ? 'ar-OM-u-nu-latn' : 'en-GB');

export function formatDate(date: Date | null | undefined, lang: Lang, tz = MUSCAT_TZ): string {
  if (!date) return '';
  return new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'long', year: 'numeric', timeZone: tz }).format(date);
}

export function formatMonthYear(date: Date | null | undefined, lang: Lang, tz = MUSCAT_TZ): string {
  if (!date) return '';
  return new Intl.DateTimeFormat(locale(lang), { month: 'long', year: 'numeric', timeZone: tz }).format(date);
}

export function formatWeekdayDate(date: Date, lang: Lang, tz = MUSCAT_TZ): string {
  return new Intl.DateTimeFormat(locale(lang), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz }).format(date);
}

export function formatTime(date: Date, lang: Lang, tz = MUSCAT_TZ): string {
  return new Intl.DateTimeFormat(locale(lang), { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz }).format(date);
}

export function formatTimeRange(start: Date, end: Date, lang: Lang, tz = MUSCAT_TZ): string {
  const parts = (d: Date) => {
    const p = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz }).formatToParts(d);
    const get = (t: string) => p.find((x) => x.type === t)?.value ?? '';
    return { hm: `${get('hour')}:${get('minute')}`, pm: get('dayPeriod') === 'PM' };
  };
  const a = parts(start);
  const b = parts(end);
  const period = (pm: boolean) => (lang === 'ar' ? (pm ? 'مساءً' : 'صباحًا') : pm ? 'PM' : 'AM');
  // مثال: 5:00 - 7:00 مساءً
  if (a.pm === b.pm) return `${a.hm} - ${b.hm} ${period(b.pm)}`;
  return `${a.hm} ${period(a.pm)} - ${b.hm} ${period(b.pm)}`;
}

export function yearOf(date: Date | null | undefined, tz = MUSCAT_TZ): number | null {
  if (!date) return null;
  return Number(new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: tz }).format(date));
}

/** يحوّل قيمة datetime-local (بتوقيت المنطقة المحددة) إلى UTC. */
export function zonedInputToUtc(value: string, tz = MUSCAT_TZ): Date | null {
  if (!value) return null;
  const [d, t = '00:00'] = value.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = t.split(':').map(Number);
  const asUtc = Date.UTC(y, m - 1, day, hh, mm);
  const offset = tzOffsetMinutes(new Date(asUtc), tz);
  return new Date(asUtc - offset * 60_000);
}

/** يعرض تاريخ UTC كقيمة datetime-local بتوقيت المنطقة المحددة. */
export function utcToZonedInput(date: Date | null | undefined, tz = MUSCAT_TZ): string {
  if (!date) return '';
  const local = new Date(date.getTime() + tzOffsetMinutes(date, tz) * 60_000);
  return local.toISOString().slice(0, 16);
}

function tzOffsetMinutes(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((asUtc - date.getTime()) / 60_000);
}
