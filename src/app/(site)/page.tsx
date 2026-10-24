import Link from 'next/link';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { db } from '@/lib/db';
import { getT, pick } from '@/lib/i18n/server';
import { getSettings } from '@/lib/queries/settings';
import { homeFeatures, latestIssue, listArticles, localizeArticle, resolveFeatureTargets, spotlightCreator, upcomingEvents } from '@/lib/queries/content';
import { formatDate, formatTimeRange, formatWeekdayDate } from '@/lib/dates';
import { Coil } from '@/components/brand/Coil';
import { Media } from '@/components/site/Media';
import { Arrow } from '@/components/site/Arrow';

// على الهاتف (أقل من md) يتوسط المحتوى؛ من md فما فوق يتبع تخطيط المرجع.

export default async function HomePage() {
  const { t, lang } = await getT();
  const settings = await getSettings();

  const [issue, heroImage, picks, spotlight, events] = await Promise.all([
    latestIssue(settings.heroIssueId),
    settings.homeHeroImageId ? db.mediaAsset.findUnique({ where: { id: settings.homeHeroImageId } }) : null,
    homeFeatures('PICKS').then((f) => resolveFeatureTargets(f, lang)),
    spotlightCreator(),
    upcomingEvents(1),
  ]);
  const pickArticleIds = picks.filter((p) => p.href.startsWith('/articles/')).map((p) => p.id);
  const writing = await listArticles({ take: 3, excludeIds: pickArticleIds.length ? await articleIdsFor(pickArticleIds) : [] });

  const heroTitle = pick(lang, settings.heroTitle, settings.heroTitleEn);
  const heroHighlight = pick(lang, settings.heroHighlight, settings.heroHighlightEn);
  const heroText = pick(lang, settings.heroText, settings.heroTextEn);
  const ticker = lang === 'en' && settings.tickerWordsEn.length ? settings.tickerWordsEn : settings.tickerWords;
  const event = events[0];

  return (
    <>
      {/* ───── الافتتاحية ───── */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden bg-[#faf9f9]">
        <div aria-hidden className="absolute inset-y-0 end-0 hidden w-[58%] bg-mint-50 md:block lg:w-[62%]" />
        <div className="container-site relative grid items-center gap-6 pt-9 pb-0 md:grid-cols-[minmax(18rem,0.55fr)_minmax(0,1fr)] md:gap-4 md:pt-0">
          <div className="relative z-10 py-2 text-center md:py-10 md:text-start">
            {/* ارتفاع سطر أكبر للعربية حتى لا تتلامس الحركات مع السطر التالي */}
            <h1
              id="hero-title"
              className="text-display font-bold tracking-tight whitespace-pre-line text-navy rtl:leading-[1.35] ltr:text-[length:clamp(2.25rem,4.4vw,4rem)] ltr:leading-[1.1]"
              lang={heroTitle.lang}
            >
              {heroTitle.text} <span className="text-orange">{heroHighlight.text}</span>
            </h1>
            <p className="mt-5 text-[length:clamp(1.15rem,2.2vw,1.6rem)] leading-[1.7] font-medium whitespace-pre-line text-navy" lang={heroText.lang}>
              {heroText.text}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start md:gap-4">
              {issue && (
                <Link href={`/issues/${issue.slug}`} className="btn btn-primary min-w-[9.5rem]">
                  {t('home.discoverIssue')} <Arrow />
                </Link>
              )}
              <Link href="/works" className="btn btn-outline min-w-[9.5rem]">
                {t('home.browseWorks')}
              </Link>
            </div>
          </div>

          {/* الصورة مُزاحة عن حافة الصفحة ليظهر خط الحلقات بجانبها كما في المرجع */}
          <div className="relative -mx-[var(--spacing-gutter)] self-end bg-mint-50 px-[var(--spacing-gutter)] pt-6 md:mx-0 md:-me-[var(--spacing-gutter)] md:bg-transparent md:ps-0 md:pe-[12%] md:pt-2 lg:pe-[20%]">
            <Coil loops={4} spread={5} radius={30} className="pointer-events-none absolute end-[-4%] top-[34%] h-[56%] w-[32%] rotate-[62deg]" />
            {issue && (
              <span className="absolute end-[9%] top-[10%] z-10 flex size-[clamp(4.5rem,8vw,5.5rem)] flex-col items-center justify-center rounded-full bg-badge text-center text-[length:clamp(0.95rem,1.4vw,1.15rem)] leading-tight font-bold text-navy">
                {t('home.newIssue').split(' ').map((w) => (
                  <span key={w} className="block">
                    {w}
                  </span>
                ))}
              </span>
            )}
            {heroImage && (
              <Media
                asset={heroImage}
                lang={lang}
                priority
                quality={75}
                sizes="(min-width: 768px) 640px, 100vw"
                className="relative mx-auto block h-auto w-full max-w-[34rem] md:max-w-[40rem]"
              />
            )}
          </div>
        </div>
      </section>

      {/* ───── الشريط الكحلي ───── */}
      {ticker.length > 0 && (
        <div className="marquee overflow-hidden bg-navy py-3 text-white" aria-label={ticker.join(lang === 'ar' ? '، ' : ', ')}>
          <div className="marquee-track flex w-max" aria-hidden>
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center">
                {Array.from({ length: 3 }).flatMap((_, r) =>
                  ticker.map((w, i) => (
                    <li key={`${r}-${i}`} className="flex items-center text-[0.95rem] font-semibold">
                      <span className="px-10">{w}</span>
                      <span className="size-1.5 rounded-full bg-orange" />
                    </li>
                  )),
                )}
              </ul>
            ))}
          </div>
        </div>
      )}

      {/* ───── مختارات ألفين ───── */}
      {picks.length > 0 && (
        <section aria-labelledby="picks-title" className="container-site pt-8 pb-6 md:pt-7 md:pb-5">
          <SectionHead id="picks-title" title={t('home.picks')} href="/works" linkLabel={t('home.allWorks')} />
          <ul className="mt-5 grid gap-x-4 gap-y-8 sm:grid-cols-3 md:mt-6">
            {picks.map((p) => {
              const title = p.titleLang ? { text: p.title, lang: p.titleLang } : pick(lang, p.title, p.titleEn);
              return (
                <li key={p.id} className="text-center sm:text-start">
                  <Link href={p.href} className="group block">
                    <div className="relative aspect-[306/178] overflow-hidden bg-mint-25">
                      {p.image && (
                        <Media asset={p.image} lang={lang} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      )}
                    </div>
                    <p className="eyebrow mt-3">{lang === 'en' ? p.labelEn : p.label}</p>
                    <h3 className="mt-0.5 text-[1.2rem] font-bold text-navy group-hover:text-orange" lang={title.lang}>
                      {title.text}
                    </h3>
                    <p className="mt-0.5 text-[0.9rem] text-ink-muted">{p.people.join(lang === 'ar' ? '، ' : ', ')}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ───── أحدث الكتابات + مبدع تحت الضوء ───── */}
      {(writing.items.length > 0 || spotlight) && (
        <div className="container-site">
          <div className={`grid border-t border-line ${spotlight && writing.items.length ? 'lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]' : ''}`}>
            {spotlight && (
              <section aria-labelledby="spotlight-title" className="relative -mx-[var(--spacing-gutter)] overflow-hidden bg-pink-50 px-6 py-7 sm:mx-0 sm:py-6">
                <div className="grid gap-6 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="flex flex-col items-center text-center sm:items-start sm:text-start">
                    <p className="eyebrow">{t('home.spotlight')}</p>
                    <h2 id="spotlight-title" className="mt-3 text-[1.75rem] font-bold text-navy">
                      {pick(lang, spotlight.displayName, spotlight.displayNameEn).text}
                    </h2>
                    {spotlight.headline && (
                      <p className="mt-1 text-[1.05rem] font-medium text-navy" lang={pick(lang, spotlight.headline, spotlight.headlineEn).lang}>
                        {pick(lang, spotlight.headline, spotlight.headlineEn).text}
                      </p>
                    )}
                    {spotlight.quote && (
                      <blockquote className="mt-5 text-[0.95rem] leading-[1.75] text-ink-muted" lang={pick(lang, spotlight.quote, spotlight.quoteEn).lang}>
                        &ldquo;{pick(lang, spotlight.quote, spotlight.quoteEn).text}&rdquo;
                      </blockquote>
                    )}
                    <Link href={`/creators/${spotlight.slug}`} className="btn btn-outline btn-sm mt-6 bg-white/60">
                      {t('home.spotlightCtaNeutral')} <Arrow />
                    </Link>
                  </div>
                  {spotlight.image && (
                    <div className="relative order-first mx-auto aspect-[233/293] w-full max-w-[16rem] sm:order-none sm:mx-0 sm:max-w-none">
                      <Media asset={spotlight.image} lang={lang} fill sizes="(min-width: 1024px) 260px, (min-width: 640px) 50vw, 256px" className="object-cover" />
                    </div>
                  )}
                </div>
              </section>
            )}

            {writing.items.length > 0 && (
              <section aria-labelledby="writing-title" className="pt-7 pb-4 sm:pt-6 lg:pe-6">
                <SectionHead id="writing-title" title={t('home.latestWriting')} href="/articles" linkLabel={t('home.allArticles')} small />
                <ul className="mt-4 divide-y divide-line">
                  {writing.items.map((a) => {
                    const loc = localizeArticle(a, lang);
                    return (
                      <li key={a.id}>
                        <Link href={`/articles/${loc.slug}`} className="group flex gap-4 py-3 sm:gap-5">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[0.98rem] leading-[1.5] font-bold text-navy group-hover:text-orange" lang={loc.lang}>
                              {loc.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-[0.86rem] leading-[1.6] text-ink-muted" lang={loc.lang}>
                              {loc.excerpt}
                            </p>
                            <p className="mt-1 flex items-center gap-2 text-[0.75rem] text-ink-muted">
                              <span className="text-orange">{tagOrCategory(a, lang)}</span>
                              <span aria-hidden className="text-line">|</span>
                              <time dateTime={a.publishedAt?.toISOString()}>{formatDate(a.publishedAt, lang)}</time>
                            </p>
                          </div>
                          {a.cover && (
                            <div className="relative aspect-[105/78] w-[5.6rem] shrink-0 self-start overflow-hidden bg-mint-25 sm:w-[6.6rem]">
                              <Media asset={a.cover} lang={lang} fill sizes="106px" className="object-cover" />
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}

      {/* ───── الفعاليات القادمة ───── */}
      {event && (
        <section aria-labelledby="event-title" className="mt-4 bg-yellow-50">
          <div className="container-site grid items-center justify-items-center gap-5 py-6 text-center lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:justify-items-start lg:gap-10 lg:py-4 lg:text-start">
            <div>
              <p className="eyebrow">{t('home.upcomingEvents')}</p>
              <h2 id="event-title" className="mt-1 text-[1.5rem] font-bold text-navy">
                <Link href={`/events/${event.slug}`} className="hover:text-orange">
                  {pick(lang, event.title, event.titleEn).text}
                </Link>
              </h2>
              <ul className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[0.8rem] whitespace-nowrap text-navy lg:justify-start">
                {event.venue && (
                  <li className="flex items-center gap-1.5">
                    <MapPin aria-hidden size={16} />
                    <span lang={pick(lang, event.venue, event.venueEn).lang}>{pick(lang, event.venue, event.venueEn).text}</span>
                  </li>
                )}
                <li className="flex items-center gap-1.5">
                  <CalendarDays aria-hidden size={16} /> <time dateTime={event.startsAt.toISOString()}>{formatWeekdayDate(event.startsAt, lang, event.timezone)}</time>
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock aria-hidden size={16} /> <span className="ltr-iso">{formatTimeRange(event.startsAt, event.endsAt, lang, event.timezone)}</span>
                </li>
              </ul>
            </div>
            {event.poster && (
              <div className="relative hidden aspect-[243/79] w-[14rem] overflow-hidden lg:block xl:w-[15.2rem]">
                <Media asset={event.poster} lang={lang} fill sizes="244px" className="object-cover" />
              </div>
            )}
            <Link href="/events" className="btn btn-outline lg:min-w-[11rem]">
              {t('home.allEvents')} <Arrow />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

/** المقالات المعروضة في المختارات لا تتكرر في أحدث الكتابات. */
async function articleIdsFor(featureIds: string[]) {
  const rows = await db.homeFeature.findMany({ where: { id: { in: featureIds } }, select: { targetId: true } });
  return rows.map((r) => r.targetId);
}

function tagOrCategory(a: { tags: Array<{ nameAr: string; nameEn: string | null }>; category: { nameAr: string; nameEn: string } }, lang: 'ar' | 'en') {
  const tag = a.tags[0];
  if (tag) return lang === 'en' && tag.nameEn ? tag.nameEn : tag.nameAr;
  return lang === 'en' ? a.category.nameEn : a.category.nameAr;
}

function SectionHead({ id, title, href, linkLabel, small }: { id: string; title: string; href: string; linkLabel: string; small?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <h2 id={id} className={`${small ? 'text-[1.6rem]' : 'text-h2'} font-bold text-navy`}>
        {title}
      </h2>
      <Link href={href} className="link-arrow shrink-0">
        {linkLabel} <Arrow />
      </Link>
    </div>
  );
}
