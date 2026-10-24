import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { getT, pick } from '@/lib/i18n/server';
import { categories, pastEvents, upcomingEvents, type EventCard } from '@/lib/queries/content';
import { registrationState, STATE_TONE } from '@/lib/events';
import { formatTimeRange, formatWeekdayDate } from '@/lib/dates';
import { flatParams, hrefWith, pageNumber } from '@/lib/url';
import { PageIntro } from '@/components/site/PageIntro';
import { FilterChips } from '@/components/site/Filters';
import { EmptyState, LoadMore, SectionTitle } from '@/components/site/Blocks';
import { EventCardView } from '@/components/site/Cards';
import { Media, MediaPlaceholder } from '@/components/site/Media';
import { Arrow } from '@/components/site/Arrow';
import type { Lang } from '@/lib/i18n/dict';
import { translate } from '@/lib/i18n/dict';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t('events.title')} ${t('events.titleHighlight')}`, description: t('events.lead') };
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t, lang } = await getT();
  const sp = flatParams(await searchParams);
  const when = sp.when === 'past' ? 'past' : 'upcoming';
  const page = pageNumber(sp.page);
  const cats = await categories('EVENT');
  const category = cats.find((c) => c.slug === sp.category)?.slug;
  const base = { category, when: when === 'past' ? 'past' : undefined };

  const upcoming = when === 'upcoming' ? await upcomingEvents(30, category) : [];
  const past = when === 'past' ? await pastEvents(page, category) : null;
  const featured = when === 'upcoming' && !category ? upcoming[0] : undefined;
  const list = when === 'upcoming' ? upcoming.filter((e) => e.id !== featured?.id) : past!.items;

  return (
    <>
      <PageIntro crumbs={[{ label: t('nav.events') }]} title={t('events.title')} highlight={t('events.titleHighlight')} lead={t('events.lead')} />

      {featured && <FeaturedEvent event={featured} lang={lang} />}

      <section aria-labelledby="events-list" className="container-site section">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle id="events-list">{when === 'past' ? t('events.past') : t('events.upcoming')}</SectionTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* القادمة / السابقة */}
            <nav aria-label={lang === 'ar' ? 'التوقيت' : 'Timing'} className="inline-flex rounded-[var(--radius-pill)] bg-chip p-1">
              {(['upcoming', 'past'] as const).map((w) => (
                <Link
                  key={w}
                  href={hrefWith('/events', base, { when: w === 'past' ? 'past' : undefined, page: undefined })}
                  aria-current={when === w ? 'true' : undefined}
                  className={`inline-flex min-h-10 items-center rounded-[var(--radius-pill)] px-5 text-sm font-semibold ${when === w ? 'bg-navy text-white' : 'text-navy hover:bg-white'}`}
                >
                  {w === 'past' ? t('events.past') : t('events.upcoming')}
                </Link>
              ))}
            </nav>
            <FilterChips
              label={lang === 'ar' ? 'أنواع الفعاليات' : 'Event types'}
              items={[
                { label: t('common.all'), href: hrefWith('/events', base, { category: undefined, page: undefined }), active: !category },
                ...cats.map((c) => ({ label: lang === 'en' ? c.nameEn : c.nameAr, href: hrefWith('/events', base, { category: c.slug, page: undefined }), active: category === c.slug })),
              ]}
            />
          </div>
        </div>

        {list.length === 0 ? (
          <div className="mt-8">
            {featured ? (
              <p className="text-ink-muted">{lang === 'ar' ? 'لا توجد فعاليات قادمة أخرى حاليًا. تصفّح الفعاليات السابقة لمشاهدة توثيقها.' : 'No other upcoming events right now. Browse past events for their documentation.'}</p>
            ) : (
              <EmptyState title={when === 'past' ? t('events.noPast') : t('events.noUpcoming')} action={category ? { href: hrefWith('/events', base, { category: undefined }), label: t('common.all') } : undefined} />
            )}
          </div>
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((e) => (
              <li key={e.id}>
                <EventCardView event={e} lang={lang} />
              </li>
            ))}
          </ul>
        )}
        {past?.hasMore && <LoadMore href={hrefWith('/events', base, { page: String(page + 1) })} label={t('common.loadMore')} shown={past.items.length} total={past.total} />}
      </section>
    </>
  );
}

function FeaturedEvent({ event, lang }: { event: EventCard; lang: Lang }) {
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const title = pick(lang, event.title, event.titleEn);
  const summary = pick(lang, event.summary, event.summaryEn);
  const venue = event.venue ? pick(lang, event.venue, event.venueEn) : null;
  const state = registrationState(event, event._count.registrations);
  return (
    <section aria-labelledby="featured-event" className="container-site mt-6 md:mt-8">
      <div className="grid overflow-hidden bg-yellow-50 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col justify-center p-6 text-center sm:p-8 md:text-start lg:p-10">
          <p className="eyebrow">{t('events.featured')}</p>
          <h2 id="featured-event" className="mt-2 text-[length:clamp(1.6rem,2.8vw,2.3rem)] font-bold text-navy" lang={title.lang}>
            {title.text}
          </h2>
          <p className="mt-3 text-[1.02rem] leading-[1.85] text-navy/90" lang={summary.lang}>
            {summary.text}
          </p>
          <ul className="mt-5 space-y-2 text-[0.95rem] text-navy">
            <li className="flex items-center justify-center gap-2 md:justify-start">
              <CalendarDays aria-hidden size={18} className="text-orange" />
              <time dateTime={event.startsAt.toISOString()}>{formatWeekdayDate(event.startsAt, lang, event.timezone)}</time>
            </li>
            <li className="flex items-center justify-center gap-2 md:justify-start">
              <Clock aria-hidden size={18} className="text-orange" />
              <span className="ltr-iso">{formatTimeRange(event.startsAt, event.endsAt, lang, event.timezone)}</span>
              <span className="text-ink-soft">({t('events.timezone')})</span>
            </li>
            {venue && (
              <li className="flex items-center justify-center gap-2 md:justify-start">
                <MapPin aria-hidden size={18} className="text-orange" /> <span lang={venue.lang}>{venue.text}</span>
              </li>
            )}
          </ul>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link href={`/events/${event.slug}`} className="btn btn-primary">
              {state === 'OPEN' || state === 'WAITLIST' ? t('events.register') : t('events.details')} <Arrow />
            </Link>
            <span className={`rounded-full px-3 py-1.5 text-[0.82rem] font-semibold ${STATE_TONE[state]}`}>{t(`events.state.${state}`)}</span>
          </div>
        </div>
        <div className="relative order-first aspect-[16/9] md:order-none md:aspect-auto md:min-h-[20rem]">
          {event.poster ? <Media asset={event.poster} lang={lang} fill priority sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" /> : <MediaPlaceholder className="absolute inset-0" />}
        </div>
      </div>
    </section>
  );
}
