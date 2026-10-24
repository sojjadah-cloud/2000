import Link from 'next/link';
import { CalendarDays, Clock, ExternalLink, Globe, MapPin, Ticket, Users, Video } from 'lucide-react';
import { translate, type Lang } from '@/lib/i18n/dict';
import { formatTimeRange, formatWeekdayDate } from '@/lib/dates';
import { registrationState, STATE_TONE } from '@/lib/events';
import { creditName, type EventDetail } from '@/lib/queries/content';
import { appUrl } from '@/lib/tokens';
import { Breadcrumbs } from '@/components/site/PageIntro';
import { Media, MediaPlaceholder } from '@/components/site/Media';
import { RichText, SectionTitle } from '@/components/site/Blocks';
import { Gallery } from '@/components/site/Gallery';
import { ShareLinks } from '@/components/site/ShareLinks';
import { RegistrationForm } from '@/components/site/RegistrationForm';

const pickText = (lang: Lang, ar: string, en?: string | null) => (lang === 'en' && en ? { text: en, lang: 'en' as const } : { text: ar, lang: 'ar' as const });

export function EventView({ event, lang, dir }: { event: EventDetail; lang: Lang; dir: 'rtl' | 'ltr' }) {
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const tx = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const title = pickText(lang, event.title, event.titleEn);
  const summary = pickText(lang, event.summary, event.summaryEn);
  const venue = event.venue ? pickText(lang, event.venue, event.venueEn) : null;
  const confirmed = event._count.registrations;
  const state = registrationState(event, confirmed);
  const seatsLeft = event.capacity != null ? Math.max(0, event.capacity - confirmed) : null;
  const ended = state === 'ENDED';
  const docs = event.media.map((m) => ({ id: m.asset.id, url: m.asset.url, width: m.asset.width, height: m.asset.height, alt: (lang === 'en' ? m.asset.altEn || m.asset.altAr : m.asset.altAr) ?? title.text }));

  return (
    <article>
      <div className="container-site pt-6 md:pt-8">
        <Breadcrumbs label={t('nav.breadcrumb')} crumbs={[{ label: t('nav.home'), href: '/' }, { label: t('nav.events'), href: '/events' }, { label: title.text }]} />
      </div>

      <div className="container-site mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0">
          {event.poster ? (
            // الملصق بنسبته الأصلية دون قص، ولا يُكبَّر لأكثر من ضعف عرضه الحقيقي حتى لا يتشوش
            <div className="bg-[#f4f4f2]">
              <div className="mx-auto" style={{ maxWidth: event.poster.width ? event.poster.width * 2 : undefined }}>
                <Media asset={event.poster} lang={lang} priority sizes="(min-width: 1024px) 760px, 100vw" className="h-auto w-full" />
              </div>
            </div>
          ) : (
            <div className="relative aspect-[16/9] bg-mint-25">
              <MediaPlaceholder className="absolute inset-0" />
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="eyebrow">{lang === 'en' ? event.category.nameEn : event.category.nameAr}</span>
            <span className={`rounded-full px-3 py-1 text-[0.8rem] font-semibold ${STATE_TONE[state]}`}>{t(`events.state.${state}`)}</span>
          </div>
          <h1 className="mt-2 text-h1 font-bold text-navy" lang={title.lang}>
            {title.text}
          </h1>
          <p className="mt-3 text-[1.1rem] leading-[1.9] text-navy/90" lang={summary.lang}>
            {summary.text}
          </p>

          {event.descriptionHtml && <RichText html={event.descriptionHtml} className="mt-6" lang="ar" />}

          {event.programHtml && (
            <section aria-labelledby="program" className="mt-10 border-t border-line pt-8">
              <SectionTitle id="program">{t('events.program')}</SectionTitle>
              <RichText html={event.programHtml} className="mt-4" lang="ar" />
            </section>
          )}

          {event.speakers.length > 0 && (
            <section aria-labelledby="speakers" className="mt-10 border-t border-line pt-8">
              <SectionTitle id="speakers">{t('events.speakers')}</SectionTitle>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {event.speakers.map((s) => {
                  const c = s.creator ? creditName(s.creator) : { name: s.name, href: null };
                  const name = lang === 'en' && s.creator?.displayNameEn ? s.creator.displayNameEn : c.name;
                  return (
                    <li key={s.id} className="border border-line bg-white px-4 py-3">
                      {c.href ? (
                        <Link href={c.href} className="font-bold text-navy hover:text-orange">
                          {name}
                        </Link>
                      ) : (
                        <span className="font-bold text-navy">{name}</span>
                      )}
                      {s.title && <p className="text-[0.88rem] text-ink-muted">{s.title}</p>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {event.partners.length > 0 && (
            <section aria-labelledby="partners" className="mt-10 border-t border-line pt-8">
              <SectionTitle id="partners">{t('events.partners')}</SectionTitle>
              <ul className="mt-5 flex flex-wrap items-center gap-6">
                {event.partners.map((p) => (
                  <li key={p.id}>
                    {p.logo ? <Media asset={p.logo} lang={lang} sizes="140px" className="h-12 w-auto object-contain" /> : <span className="font-semibold text-navy">{p.name}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {ended && (docs.length > 0 || event.recordingUrl) && (
            <section aria-labelledby="docs" className="mt-10 border-t border-line pt-8">
              <SectionTitle id="docs">{t('events.documentation')}</SectionTitle>
              {event.recordingUrl && (
                <a href={event.recordingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-5">
                  <Video aria-hidden size={18} /> {t('events.recording')}
                </a>
              )}
              {docs.length > 0 && (
                <div className="mt-5">
                  <Gallery images={docs} dir={dir} labels={{ enlarge: t('works.enlarge'), close: t('works.close'), next: t('common.next'), prev: t('common.prev'), imageOf: t('works.imageOf') }} />
                </div>
              )}
            </section>
          )}
        </div>

        {/* بطاقة الموعد والتسجيل */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-line bg-white p-5 sm:p-6">
            <dl className="space-y-4 text-[0.95rem] text-navy">
              <Row icon={<CalendarDays aria-hidden size={19} />} label={t('events.date')}>
                <time dateTime={event.startsAt.toISOString()}>{formatWeekdayDate(event.startsAt, lang, event.timezone)}</time>
              </Row>
              <Row icon={<Clock aria-hidden size={19} />} label={tx('الوقت', 'Time')}>
                <span className="ltr-iso">{formatTimeRange(event.startsAt, event.endsAt, lang, event.timezone)}</span>{' '}
                <span className="text-ink-soft">({event.timezone === 'Asia/Muscat' ? t('events.timezone') : event.timezone})</span>
              </Row>
              {venue && (
                <Row icon={<MapPin aria-hidden size={19} />} label={t('events.venue')}>
                  <span lang={venue.lang}>{venue.text}</span>
                  {event.mapUrl && (
                    <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="ms-2 inline-flex items-center gap-1 text-orange-600 underline">
                      {t('events.map')} <ExternalLink aria-hidden size={13} />
                    </a>
                  )}
                </Row>
              )}
              {event.onlineUrl && (
                <Row icon={<Video aria-hidden size={19} />} label={t('events.online')}>
                  <a href={event.onlineUrl} target="_blank" rel="noopener noreferrer" className="ltr-iso break-all text-orange-600 underline">
                    {event.onlineUrl.replace(/^https?:\/\//, '')}
                  </a>
                </Row>
              )}
              <Row icon={<Globe aria-hidden size={19} />} label={t('events.language')}>
                {event.language}
              </Row>
              {event.audience && (
                <Row icon={<Users aria-hidden size={19} />} label={t('events.audience')}>
                  {event.audience}
                </Row>
              )}
              {event.fee && (
                <Row icon={<Ticket aria-hidden size={19} />} label={t('events.fee')}>
                  {event.fee}
                </Row>
              )}
              {event.capacity != null && (
                <Row icon={<Users aria-hidden size={19} />} label={t('events.capacity')}>
                  <span className="ltr-iso">{event.capacity}</span>
                  {!ended && seatsLeft != null && (
                    <span className="text-ink-soft">
                      {' '}
                      · <span className="ltr-iso">{seatsLeft}</span> {t('events.reg.seatsLeft')}
                    </span>
                  )}
                </Row>
              )}
            </dl>

            <div className="mt-6 border-t border-line pt-5">
              {state === 'OPEN' || state === 'WAITLIST' ? (
                <>
                  <h2 className="mb-4 text-lg font-bold text-navy">{state === 'WAITLIST' ? t('events.reg.joinWaitlist') : t('events.register')}</h2>
                  <RegistrationForm
                    eventId={event.id}
                    waitlist={state === 'WAITLIST'}
                    labels={{ name: t('events.reg.name'), email: t('events.reg.email'), submit: t('events.reg.submit'), waitlist: t('events.reg.joinWaitlist'), required: t('common.required') }}
                  />
                </>
              ) : (
                <p className={`rounded px-4 py-3 text-center text-[0.95rem] font-semibold ${STATE_TONE[state]}`}>{t(`events.state.${state}`)}</p>
              )}
            </div>
            {event.instructions && !ended && (
              <div className="mt-5 rounded bg-mint-25 p-4 text-[0.92rem] text-navy">
                <p className="font-semibold">{t('events.instructions')}</p>
                <p className="mt-1 whitespace-pre-line text-ink-muted">{event.instructions}</p>
              </div>
            )}
          </div>
          <div className="mt-5">
            <ShareLinks url={appUrl(`/events/${event.slug}`)} title={title.text} labels={{ share: t('common.share'), copy: t('common.copyLink'), copied: t('common.copied') }} />
          </div>
        </aside>
      </div>
      <div className="pb-[var(--spacing-section)]" />
    </article>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
      <span className="mt-0.5 text-orange">{icon}</span>
      <div>
        <dt className="text-[0.8rem] text-ink-muted">{label}</dt>
        <dd className="font-semibold">{children}</dd>
      </div>
    </div>
  );
}
