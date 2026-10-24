import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { getT, pick } from '@/lib/i18n/server';
import { translate, type Lang } from '@/lib/i18n/dict';
import { issueYears, latestIssue, listIssues } from '@/lib/queries/content';
import { getSettings } from '@/lib/queries/settings';
import { flatParams, hrefWith, pageNumber } from '@/lib/url';
import { PageIntro } from '@/components/site/PageIntro';
import { FilterChips, SearchField } from '@/components/site/Filters';
import { SelectNav } from '@/components/site/SelectNav';
import { EmptyState, LoadMore, SectionTitle } from '@/components/site/Blocks';
import { IssueCardView, formatLabel, languageLabel } from '@/components/site/Cards';
import { Media } from '@/components/site/Media';
import { Arrow } from '@/components/site/Arrow';
import { Coil } from '@/components/brand/Coil';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('issues.title'), description: t('issues.lead') };
}

export default async function IssuesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t, lang } = await getT();
  const sp = flatParams(await searchParams);
  const page = pageNumber(sp.page);
  const format = sp.format === 'digital' ? 'DIGITAL' : sp.format === 'print' ? 'PRINT' : undefined;
  const year = sp.year && /^\d{4}$/.test(sp.year) ? Number(sp.year) : undefined;
  const q = sp.q?.trim().slice(0, 100) || undefined;

  const settings = await getSettings();
  const [latest, years, list] = await Promise.all([latestIssue(settings.heroIssueId), issueYears(), listIssues({ q, year, format, page })]);
  const filtering = !!(q || year || format);
  const base = { q, year: sp.year, format: sp.format };

  return (
    <>
      <PageIntro crumbs={[{ label: t('nav.issues') }]} title={t('issues.title')} lead={t('issues.lead')} />

      {latest && !filtering && <LatestIssue issue={latest} lang={lang} />}

      <section aria-labelledby="browse-title" className="container-site pt-6 pb-[var(--spacing-section)] md:pt-5">
        <div className="border-t border-line pt-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle id="browse-title">
              {t('issues.browse')}
            </SectionTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              <FilterChips
                label={t('issues.filterFormat')}
                items={[
                  { label: t('common.all'), href: hrefWith('/issues', base, { format: undefined, page: undefined }), active: !format },
                  { label: t('issues.digital'), href: hrefWith('/issues', base, { format: 'digital', page: undefined }), active: format === 'DIGITAL' },
                  { label: t('issues.print'), href: hrefWith('/issues', base, { format: 'print', page: undefined }), active: format === 'PRINT' },
                ]}
              />
              <div className="grid grid-cols-2 gap-3 sm:flex">
                <SelectNav
                  label={t('issues.filterYear')}
                  value={year ? String(year) : ''}
                  className="sm:w-40"
                  options={[
                    { label: t('issues.allYears'), value: '', href: hrefWith('/issues', base, { year: undefined, page: undefined }) },
                    ...years.map((y) => ({ label: String(y), value: String(y), href: hrefWith('/issues', base, { year: String(y), page: undefined }) })),
                  ]}
                />
                <SearchField action="/issues" value={q} placeholder={t('issues.searchPlaceholder')} label={t('common.search')} keep={{ year: sp.year, format: sp.format }} className="sm:w-56" />
              </div>
            </div>
          </div>

          {list.items.length === 0 ? (
            <div className="mt-8">
              <EmptyState title={filtering ? t('common.noResults') : t('common.empty')} action={filtering ? { href: '/issues', label: t('common.all') } : undefined} />
            </div>
          ) : (
            <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {list.items.map((issue) => (
                <li key={issue.id} className="border-b border-line pb-8">
                  <IssueCardView issue={issue} lang={lang} />
                </li>
              ))}
            </ul>
          )}
          {list.hasMore && <LoadMore href={hrefWith('/issues', base, { page: String(page + 1) })} label={t('common.loadMore')} shown={list.items.length} total={list.total} />}
        </div>
      </section>
    </>
  );
}

async function LatestIssue({ issue, lang }: { issue: NonNullable<Awaited<ReturnType<typeof latestIssue>>>; lang: Lang }) {
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const title = pick(lang, issue.title, issue.titleEn);
  const theme = pick(lang, issue.theme, issue.themeEn);
  const summary = pick(lang, issue.summary, issue.summaryEn);
  const image = issue.promoImage ?? issue.cover;
  return (
    <section aria-labelledby="latest-title" className="container-site mt-6 md:mt-20">
      <div className="relative bg-mint-40">
        <Coil loops={3} className="pointer-events-none absolute end-[1%] bottom-6 hidden h-40 w-40 rotate-[70deg] md:block" />
        <div className="relative grid gap-6 px-5 pt-6 pb-0 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8 md:py-6 lg:px-10">
          <div className="text-center md:py-4 md:text-start">
            <span className="inline-block rounded-[3px] bg-orange px-4 py-1.5 text-[0.85rem] font-semibold text-white">{t('issues.latest')}</span>
            <h2 id="latest-title" className="mt-4 text-[length:clamp(1.7rem,2.8vw,2.35rem)] font-bold text-navy" lang={title.lang}>
              {title.text}
            </h2>
            <p className="mt-1 text-[length:clamp(1.25rem,2vw,1.6rem)] font-bold text-orange" lang={theme.lang}>
              {theme.text}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-[1rem] leading-[1.85] text-navy md:mx-0" lang={summary.lang}>
              {summary.text}
            </p>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.9rem] text-navy md:justify-start">
              <Globe aria-hidden size={16} />
              {issue.editionNote && (
                <>
                  <span>{issue.editionNote}</span>
                  <span aria-hidden className="size-1.5 rounded-full bg-orange" />
                </>
              )}
              <span>{languageLabel(lang, issue.language)}</span>
              <span aria-hidden className="size-1.5 rounded-full bg-orange" />
              <span>{formatLabel(lang, issue.format)}</span>
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link href={issue.pdfId ? `/issues/${issue.slug}/read` : `/issues/${issue.slug}`} className="btn btn-primary min-w-[10rem]">
                {t('issues.read')} <Arrow />
              </Link>
              <Link href={`/issues/${issue.slug}#contents`} className="btn btn-outline min-w-[10rem] bg-white/60">
                {t('issues.explore')} <Arrow />
              </Link>
            </div>
          </div>
          {image && (
            // من md فما فوق: كما في المرجع، 30% من الصورة فوق حافة اللوحة وأسفلها على بعد 20px من قاع اللوحة.
            // الارتفاع = (ارتفاع اللوحة − 20px) ÷ 0.7، والعرض يتبع نسبة الصورة.
            <div className="relative order-first mx-auto w-full max-w-[26rem] md:static md:order-none md:mx-0 md:max-w-none">
              <Media
                asset={image}
                lang={lang}
                priority
                sizes="(min-width: 768px) 520px, 90vw"
                className="h-auto w-full md:absolute md:end-[3%] md:bottom-5 md:h-[calc((100%-1.25rem)/0.7)] md:w-auto md:max-w-[48%] md:object-contain md:object-bottom"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
