import Link from 'next/link';
import { BookOpen, CalendarDays, Download, Globe, Monitor, ShoppingBag } from 'lucide-react';
import { translate, type Lang } from '@/lib/i18n/dict';
import { formatMonthYear } from '@/lib/dates';
import { creditName, localizeArticle, type IssueCard, type IssueDetail } from '@/lib/queries/content';
import { appUrl } from '@/lib/tokens';
import { Breadcrumbs } from '@/components/site/PageIntro';
import { Media, MediaPlaceholder } from '@/components/site/Media';
import { RichText, SectionTitle } from '@/components/site/Blocks';
import { IssueCardView, formatLabel, languageLabel } from '@/components/site/Cards';
import { ShareLinks } from '@/components/site/ShareLinks';
import { Arrow } from '@/components/site/Arrow';

const pickText = (lang: Lang, ar: string, en?: string | null) => (lang === 'en' && en ? { text: en, lang: 'en' as const } : { text: ar, lang: 'ar' as const });

export function IssueView({ issue, related, lang }: { issue: IssueDetail; related: IssueCard[]; lang: Lang }) {
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const title = pickText(lang, issue.title, issue.titleEn);
  const theme = pickText(lang, issue.theme, issue.themeEn);
  const summary = pickText(lang, issue.summary, issue.summaryEn);
  const FormatIcon = issue.format === 'DIGITAL' ? Monitor : BookOpen;

  // الفهرس: الأعمال والمقالات مرتبة حسب ترتيبها في العدد
  const contents = [
    ...issue.works.map((w) => ({
      key: `w-${w.id}`, order: w.issueOrder, href: `/works/${w.slug}`, title: pickText(lang, w.title, w.titleEn),
      type: t('issues.type.work'), category: lang === 'en' ? w.category.nameEn : w.category.nameAr, people: w.creators.map((c) => c.creator),
    })),
    ...issue.articles.map((a) => {
      const loc = localizeArticle(a, lang);
      return {
        key: `a-${a.id}`, order: a.issueOrder, href: `/articles/${loc.slug}`, title: { text: loc.title, lang: loc.lang as 'ar' | 'en' },
        type: t('issues.type.article'), category: lang === 'en' ? a.category.nameEn : a.category.nameAr, people: a.authors.map((c) => c.creator),
      };
    }),
  ].sort((a, b) => a.order - b.order);

  return (
    <article>
      <div className="container-site pt-6 md:pt-8">
        <Breadcrumbs crumbs={[{ label: t('nav.home'), href: '/' }, { label: t('nav.issues'), href: '/issues' }, { label: title.text }]} label={t('nav.breadcrumb')} />
      </div>

      {/* الغلاف والمعلومات */}
      <header className="container-site mt-6 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-start lg:gap-14">
        <div className="text-center md:text-start">
          <p className="text-[0.95rem] font-semibold text-ink-muted">
            {t('issues.number')} <span className="ltr-iso">{issue.number}</span>
          </p>
          <h1 className="mt-1 text-h1 font-bold text-navy" lang={title.lang}>
            {title.text}
          </h1>
          <p className="mt-1 text-[length:clamp(1.3rem,2.2vw,1.75rem)] font-bold text-orange" lang={theme.lang}>
            {theme.text}
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-[1.08rem] leading-[1.95] text-navy md:mx-0" lang={summary.lang}>
            {summary.text}
          </p>
          <dl className="mt-6 grid gap-x-8 gap-y-3 text-[0.95rem] text-navy sm:grid-cols-2">
            {issue.releaseDate && (
              <Meta icon={<CalendarDays aria-hidden size={17} />} label={t('issues.release')} value={formatMonthYear(issue.releaseDate, lang)} />
            )}
            <Meta icon={<Globe aria-hidden size={17} />} label={t('issues.language')} value={languageLabel(lang, issue.language)} />
            <Meta icon={<FormatIcon aria-hidden size={17} />} label={t('issues.format')} value={[formatLabel(lang, issue.format), issue.editionNote].filter(Boolean).join(' · ')} />
          </dl>
          <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
            {issue.pdf ? (
              <Link href={`/issues/${issue.slug}/read`} className="btn btn-primary min-w-[10rem]">
                {t('issues.read')} <Arrow />
              </Link>
            ) : (
              <p className="rounded bg-chip px-4 py-2.5 text-sm text-ink-muted">{t('issues.noPdf')}</p>
            )}
            {issue.pdf && issue.allowDownload && (
              <a href={issue.pdf.url} download className="btn btn-outline">
                <Download aria-hidden size={18} /> {t('issues.download')}
              </a>
            )}
            {issue.printUrl && (
              <a href={issue.printUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                <ShoppingBag aria-hidden size={18} /> {t('issues.getPrint')}
              </a>
            )}
          </div>
          {issue.printAvailability && (
            <div className="mt-5 rounded bg-mint-25 p-4 text-start text-[0.95rem] text-navy">
              <p className="font-semibold">{t('issues.printWhere')}</p>
              <p className="mt-1 whitespace-pre-line text-ink-muted">{issue.printAvailability}</p>
            </div>
          )}
          <div className="mt-6 flex justify-center md:justify-start">
            <ShareLinks url={appUrl(`/issues/${issue.slug}`)} title={`${title.text} — ${theme.text}`} labels={{ share: t('common.share'), copy: t('common.copyLink'), copied: t('common.copied') }} />
          </div>
        </div>
        <div className="relative order-first mx-auto aspect-[170/250] w-full max-w-[19rem] shadow-[0_18px_40px_-18px_rgb(13_20_47/0.55)] md:order-none md:max-w-none">
          {issue.cover ? <Media asset={issue.cover} lang={lang} fill priority sizes="(min-width: 768px) 360px, 80vw" className="object-cover" /> : <MediaPlaceholder className="absolute inset-0" />}
        </div>
      </header>

      {/* كلمة التحرير */}
      {issue.editorialHtml && (
        <section aria-labelledby="editorial-title" className="container-site section">
          <div className="border-t border-line pt-8">
            <SectionTitle id="editorial-title">{t('issues.editorial')}</SectionTitle>
            <RichText html={issue.editorialHtml} className="mt-5" lang="ar" />
          </div>
        </section>
      )}

      {/* الفهرس */}
      <section id="contents" aria-labelledby="contents-title" className="container-site scroll-mt-28 pb-[var(--spacing-section)]">
        <div className="border-t border-line pt-8">
          <SectionTitle id="contents-title">{t('issues.contents')}</SectionTitle>
          {contents.length === 0 ? (
            <p className="mt-5 text-ink-muted">{t('issues.contentsEmpty')}</p>
          ) : (
            <ol className="mt-6 divide-y divide-line border-y border-line">
              {contents.map((c, i) => (
                <li key={c.key}>
                  <Link href={c.href} className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 py-4 sm:gap-5">
                    <span className="ltr-iso text-[1.1rem] font-bold text-orange">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0">
                      <span className="block font-bold text-navy group-hover:text-orange" lang={c.title.lang}>
                        {c.title.text}
                      </span>
                      <span className="mt-0.5 block text-[0.85rem] text-ink-muted">
                        {c.category} · {c.people.map((p) => (lang === 'en' && p.displayNameEn ? p.displayNameEn : p.displayName)).join(lang === 'ar' ? '، ' : ', ')}
                      </span>
                    </span>
                    <span className="hidden text-[0.8rem] text-ink-soft sm:block">{c.type}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* فريق العدد */}
      {issue.team.length > 0 && (
        <section aria-labelledby="team-title" className="container-site pb-[var(--spacing-section)]">
          <SectionTitle id="team-title">{t('issues.team')}</SectionTitle>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {issue.team.map((m) => {
              const credit = m.creator ? creditName(m.creator) : { name: m.name, href: null };
              const name = lang === 'en' && m.creator?.displayNameEn ? m.creator.displayNameEn : credit.name;
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 border border-line bg-white px-4 py-3">
                  {credit.href ? (
                    <Link href={credit.href} className="font-bold text-navy hover:text-orange">
                      {name}
                    </Link>
                  ) : (
                    <span className="font-bold text-navy">{name}</span>
                  )}
                  <span className="text-[0.88rem] text-ink-muted">{m.role}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="bg-[#faf9f9]">
          <div className="container-site section">
            <SectionTitle id="related-title" action={<Link href="/issues" className="link-arrow">{t('common.viewAll')} <Arrow /></Link>}>
              {t('issues.related')}
            </SectionTitle>
            <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <IssueCardView issue={r} lang={lang} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-center gap-2 md:justify-start">
      <span className="text-orange">{icon}</span>
      <dt className="text-ink-muted">{label}:</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
