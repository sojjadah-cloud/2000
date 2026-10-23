import Link from 'next/link';
import { BookOpen, CalendarDays, MapPin, Monitor, Star } from 'lucide-react';
import { translate, type Lang } from '@/lib/i18n/dict';
import { formatDate, formatMonthYear, formatTimeRange, formatWeekdayDate } from '@/lib/dates';
import { registrationState, STATE_TONE } from '@/lib/events';
import { localizeArticle, type ArticleCard, type CreatorCard, type EventCard, type IssueCard, type WorkCard } from '@/lib/queries/content';
import { Media, MediaPlaceholder } from './Media';
import { Arrow } from './Arrow';

const pickText = (lang: Lang, ar: string, en?: string | null) => (lang === 'en' && en ? { text: en, lang: 'en' as const } : { text: ar, lang: 'ar' as const });
const personName = (lang: Lang, c: { displayName: string; displayNameEn: string | null }) => (lang === 'en' && c.displayNameEn ? c.displayNameEn : c.displayName);

export function formatLabel(lang: Lang, format: 'DIGITAL' | 'PRINT' | 'BOTH') {
  return translate(lang, format === 'BOTH' ? 'issues.both' : format === 'PRINT' ? 'issues.print' : 'issues.digital');
}

export function languageLabel(lang: Lang, value: string) {
  return translate(lang, value.includes(',') ? 'issues.lang.both' : value === 'en' ? 'issues.lang.en' : 'issues.lang.ar');
}

// ───────── العدد ─────────
export function IssueCardView({ issue, lang }: { issue: IssueCard; lang: Lang }) {
  const title = pickText(lang, issue.title, issue.titleEn);
  const theme = pickText(lang, issue.theme, issue.themeEn);
  const summary = pickText(lang, issue.summary, issue.summaryEn);
  const FormatIcon = issue.format === 'DIGITAL' ? Monitor : BookOpen;
  return (
    <article className="group relative grid h-full grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] gap-4 sm:gap-5">
      <div className="flex min-w-0 flex-col">
        <h3 className="card-title text-[length:clamp(1.1rem,1.6vw,1.3rem)]" lang={title.lang}>
          <Link href={`/issues/${issue.slug}`} className="after:absolute after:inset-0 hover:text-orange">
            {title.text}
          </Link>
        </h3>
        <p className="mt-1 text-[1.02rem] font-semibold text-orange" lang={theme.lang}>
          {theme.text}
        </p>
        <p className="mt-3 line-clamp-3 text-[0.92rem] leading-[1.75] text-ink-muted" lang={summary.lang}>
          {summary.text}
        </p>
        <p className="mt-3 text-[0.82rem] text-ink-muted">
          <time dateTime={issue.releaseDate?.toISOString()}>{formatMonthYear(issue.releaseDate, lang)}</time>
        </p>
        <p className="mt-1.5 flex items-center gap-2 text-[0.82rem] text-ink-muted">
          <FormatIcon aria-hidden size={16} className="text-navy" /> {formatLabel(lang, issue.format)}
        </p>
        <span className="link-arrow mt-auto pt-2">
          {translate(lang, 'issues.read')} <Arrow />
        </span>
      </div>
      <div className="relative aspect-[170/250] w-full self-start overflow-hidden bg-mint-25 shadow-[0_6px_18px_-8px_rgb(13_20_47/0.35)]">
        {issue.cover ? (
          <Media asset={issue.cover} lang={lang} fill sizes="(min-width: 1024px) 200px, 40vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <MediaPlaceholder className="absolute inset-0" />
        )}
      </div>
    </article>
  );
}

// ───────── العمل ─────────
export type WorkShape = 'tall' | 'wide' | 'banner' | 'banner2' | 'square';
// النسب مأخوذة من صفحة إبداعات المرجعية؛ صفّ البطاقتين الأخيرتين بنفس الارتفاع وعرضين مختلفين
const SHAPE: Record<WorkShape, string> = {
  tall: 'aspect-[273/356]',
  wide: 'aspect-[271/188]',
  banner: 'aspect-[464/193]',
  banner2: 'aspect-[464/193] lg:aspect-[368/193]',
  square: 'aspect-square',
};

export function WorkCardView({ work, lang, shape = 'square', sizes }: { work: WorkCard; lang: Lang; shape?: WorkShape; sizes?: string }) {
  const title = pickText(lang, work.title, work.titleEn);
  return (
    <article className="group relative">
      <div className={`relative overflow-hidden bg-mint-25 ${SHAPE[shape]}`}>
        {work.thumbnail ? (
          <Media asset={work.thumbnail} lang={lang} fill sizes={sizes ?? '(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw'} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <MediaPlaceholder className="absolute inset-0" />
        )}
        {work.editorsPick && (
          <span className="absolute end-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-pink-50/95 px-3 py-1 text-[0.78rem] font-semibold text-orange">
            <Star aria-hidden size={13} /> {translate(lang, 'works.editorsPick')}
          </span>
        )}
      </div>
      <p className="eyebrow mt-3">{lang === 'en' ? work.category.nameEn : work.category.nameAr}</p>
      <h3 className="card-title mt-0.5" lang={title.lang}>
        <Link href={`/works/${work.slug}`} className="after:absolute after:inset-0 group-hover:text-orange">
          {title.text}
        </Link>
      </h3>
      <p className="mt-0.5 text-[0.9rem] text-ink-muted">{work.creators.map((c) => personName(lang, c.creator)).join(lang === 'ar' ? '، ' : ', ')}</p>
    </article>
  );
}

// ───────── المقال ─────────
export function ArticleCardView({ article, lang, compact = false }: { article: ArticleCard; lang: Lang; compact?: boolean }) {
  const loc = localizeArticle(article, lang);
  const label = article.tags[0] ? (lang === 'en' && article.tags[0].nameEn ? article.tags[0].nameEn : article.tags[0].nameAr) : lang === 'en' ? article.category.nameEn : article.category.nameAr;
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[3/2] overflow-hidden bg-mint-25">
        {article.cover ? (
          <Media asset={article.cover} lang={lang} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <MediaPlaceholder className="absolute inset-0" />
        )}
      </div>
      <p className="eyebrow mt-3">{label}</p>
      <h3 className="card-title mt-0.5" lang={loc.lang}>
        <Link href={`/articles/${loc.slug}`} className="after:absolute after:inset-0 group-hover:text-orange">
          {loc.title}
        </Link>
      </h3>
      {!compact && (
        <p className="mt-1.5 line-clamp-2 text-[0.92rem] leading-[1.7] text-ink-muted" lang={loc.lang}>
          {loc.excerpt}
        </p>
      )}
      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[0.8rem] text-ink-muted">
        <span>{article.authors.map((a) => personName(lang, a.creator)).join(lang === 'ar' ? '، ' : ', ')}</span>
        <span aria-hidden className="text-line">|</span>
        <time dateTime={article.publishedAt?.toISOString()}>{formatDate(article.publishedAt, lang)}</time>
        <span aria-hidden className="text-line">|</span>
        <span>
          <span className="ltr-iso">{article.readingMinutes}</span> {translate(lang, 'common.minutes')}
        </span>
      </p>
    </article>
  );
}

// ───────── الفعالية ─────────
export function EventCardView({ event, lang }: { event: EventCard; lang: Lang }) {
  const title = pickText(lang, event.title, event.titleEn);
  const venue = event.venue ? pickText(lang, event.venue, event.venueEn) : null;
  const state = registrationState(event, event._count.registrations);
  return (
    <article className="group relative flex h-full flex-col border border-line bg-white">
      <div className="relative aspect-[16/9] overflow-hidden bg-mint-25">
        {event.poster ? (
          <Media asset={event.poster} lang={lang} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <MediaPlaceholder className="absolute inset-0" />
        )}
        <span className={`absolute start-3 top-3 rounded-full px-3 py-1 text-[0.78rem] font-semibold ${STATE_TONE[state]}`}>
          {translate(lang, `events.state.${state}`)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="eyebrow">{lang === 'en' ? event.category.nameEn : event.category.nameAr}</p>
        <h3 className="card-title mt-1" lang={title.lang}>
          <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0 group-hover:text-orange">
            {title.text}
          </Link>
        </h3>
        <ul className="mt-3 space-y-1.5 text-[0.86rem] text-navy">
          <li className="flex items-start gap-2">
            <CalendarDays aria-hidden size={16} className="mt-1 shrink-0" />
            <span>
              <time dateTime={event.startsAt.toISOString()}>{formatWeekdayDate(event.startsAt, lang, event.timezone)}</time>
              <span className="mx-1 text-line">·</span>
              <span className="ltr-iso">{formatTimeRange(event.startsAt, event.endsAt, lang, event.timezone)}</span>
            </span>
          </li>
          {venue && (
            <li className="flex items-start gap-2">
              <MapPin aria-hidden size={16} className="mt-1 shrink-0" /> <span lang={venue.lang}>{venue.text}</span>
            </li>
          )}
        </ul>
        <span className="link-arrow mt-auto pt-3">
          {translate(lang, 'events.details')} <Arrow />
        </span>
      </div>
    </article>
  );
}

// ───────── المبدع ─────────
export function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const initial = name.trim().replace(/^ال/, '').charAt(0);
  return (
    <div aria-hidden className={`flex items-center justify-center bg-mint-40 font-bold text-navy ${className}`}>
      <span className="text-[2.2em] leading-none">{initial}</span>
    </div>
  );
}

export function CreatorCardView({ creator, lang }: { creator: CreatorCard; lang: Lang }) {
  const name = personName(lang, creator);
  const headline = creator.headline ? pickText(lang, creator.headline, creator.headlineEn) : null;
  return (
    <article className="group relative flex h-full flex-col items-center border border-line bg-white p-5 text-center transition-colors hover:border-orange/60">
      <div className="relative size-28 overflow-hidden rounded-full">
        {creator.photo ? (
          <Media asset={creator.photo} lang={lang} fill sizes="112px" className="object-cover" />
        ) : (
          <Avatar name={name} className="size-full text-[1.1rem]" />
        )}
      </div>
      <h3 className="card-title mt-4">
        <Link href={`/creators/${creator.slug}`} className="after:absolute after:inset-0 group-hover:text-orange">
          {name}
        </Link>
      </h3>
      {headline && (
        <p className="mt-1 text-[0.9rem] text-ink-muted" lang={headline.lang}>
          {headline.text}
        </p>
      )}
      {creator.fields.length > 0 && (
        <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
          {creator.fields.map((f) => (
            <li key={f.id} className="rounded-full bg-chip px-3 py-1 text-[0.78rem] text-navy">
              {lang === 'en' ? f.nameEn : f.nameAr}
            </li>
          ))}
        </ul>
      )}
      {creator.openToCollab && <p className="mt-3 text-[0.8rem] font-semibold text-orange">{translate(lang, 'creators.openToCollab')}</p>}
    </article>
  );
}
