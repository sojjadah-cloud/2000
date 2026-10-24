import type { Metadata } from 'next';
import Link from 'next/link';
import { getT, pick } from '@/lib/i18n/server';
import { siteSearch } from '@/lib/queries/search';
import { formatDate } from '@/lib/dates';
import { PageIntro } from '@/components/site/PageIntro';
import { SearchField } from '@/components/site/Filters';
import { EmptyState, SectionTitle } from '@/components/site/Blocks';
import type { DictKey } from '@/lib/i18n/dict';

export const metadata: Metadata = { title: 'البحث', robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t, lang } = await getT();
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 100) ?? '';
  const res = q ? await siteSearch(q) : null;

  // في الإنجليزية تُفضَّل النسخة الإنجليزية من المقالات، وفي العربية الأصل؛ دون تكرار المادة نفسها
  const articles = (res?.articles ?? []).filter((a) => (lang === 'en' ? a.lang === 'en' || !a.translation : a.lang === 'ar' || !a.translationOf)).slice(0, 6);

  type Group = { key: DictKey; href: string; items: Array<{ href: string; title: string; titleLang: string; meta?: string }> };
  const groups: Group[] = res
    ? ([
        { key: 'search.type.issues', href: `/issues?q=${encodeURIComponent(q)}`, items: res.issues.map((i) => ({ href: `/issues/${i.slug}`, title: `${pick(lang, i.title, i.titleEn).text} — ${pick(lang, i.theme, i.themeEn).text}`, titleLang: pick(lang, i.title, i.titleEn).lang, meta: pick(lang, i.summary, i.summaryEn).text })) },
        { key: 'search.type.works', href: `/works?q=${encodeURIComponent(q)}`, items: res.works.map((w) => ({ href: `/works/${w.slug}`, title: pick(lang, w.title, w.titleEn).text, titleLang: pick(lang, w.title, w.titleEn).lang, meta: lang === 'en' ? w.category.nameEn : w.category.nameAr })) },
        { key: 'search.type.articles', href: `/articles?q=${encodeURIComponent(q)}`, items: articles.map((a) => ({ href: `/articles/${a.slug}`, title: a.title, titleLang: a.lang, meta: a.excerpt })) },
        { key: 'search.type.creators', href: `/creators?q=${encodeURIComponent(q)}`, items: res.creators.map((c) => ({ href: `/creators/${c.slug}`, title: pick(lang, c.displayName, c.displayNameEn).text, titleLang: pick(lang, c.displayName, c.displayNameEn).lang, meta: c.headline ? pick(lang, c.headline, c.headlineEn).text : undefined })) },
        { key: 'search.type.events', href: '/events', items: res.events.map((e) => ({ href: `/events/${e.slug}`, title: pick(lang, e.title, e.titleEn).text, titleLang: pick(lang, e.title, e.titleEn).lang, meta: formatDate(e.startsAt, lang, e.timezone) })) },
      ] satisfies Group[]).filter((g) => g.items.length)
    : [];

  return (
    <>
      <PageIntro crumbs={[{ label: t('search.title') }]} title={t('search.title')} coil={false}>
        <SearchField action="/search" value={q} placeholder={t('search.placeholder')} label={t('common.search')} className="mt-6 max-w-2xl" />
      </PageIntro>
      <div className="container-site pt-6 pb-[var(--spacing-section)]">
        {!q ? (
          <p className="text-ink-muted">{t('search.hint')}</p>
        ) : res === null ? (
          <p role="status" className="text-ink-muted">
            {t('search.hint')}
          </p>
        ) : groups.length === 0 ? (
          <EmptyState title={t('common.noResults')} text={lang === 'ar' ? 'جرّب كلمة أخرى أو تصفح الأقسام.' : 'Try another word or browse the sections.'} />
        ) : (
          <>
            <p role="status" className="text-ink-muted">
              {t('search.results')} «<span dir="auto">{q}</span>»
            </p>
            <div className="mt-6 space-y-10">
              {groups.map((g) => (
                <section key={g.key} aria-labelledby={g.key}>
                  <SectionTitle id={g.key} action={<Link href={g.href} className="link-arrow">{t('common.viewAll')}</Link>}>
                    {t(g.key)}
                  </SectionTitle>
                  <ul className="mt-4 divide-y divide-line border-y border-line">
                    {g.items.map((i) => (
                      <li key={i.href}>
                        <Link href={i.href} className="group block py-3.5">
                          <span className="block font-bold text-navy group-hover:text-orange" lang={i.titleLang}>
                            {i.title}
                          </span>
                          {i.meta && <span className="mt-0.5 line-clamp-1 block text-sm text-ink-muted">{i.meta}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
