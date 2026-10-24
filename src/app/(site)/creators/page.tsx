import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/server';
import { categories, listCreators } from '@/lib/queries/content';
import { flatParams, hrefWith, pageNumber } from '@/lib/url';
import { PageIntro } from '@/components/site/PageIntro';
import { FilterChips, SearchField } from '@/components/site/Filters';
import { CtaBand, EmptyState, LoadMore } from '@/components/site/Blocks';
import { CreatorCardView } from '@/components/site/Cards';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t('creators.title')} ${t('creators.titleHighlight')}`, description: t('creators.lead') };
}

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t, lang } = await getT();
  const sp = flatParams(await searchParams);
  const page = pageNumber(sp.page);
  const q = sp.q?.trim().slice(0, 100) || undefined;
  const fields = await categories('FIELD');
  const field = fields.find((f) => f.slug === sp.field)?.slug;
  const list = await listCreators({ q, field, page });
  const base = { q, field };
  const filtering = !!(q || field);

  return (
    <>
      <PageIntro crumbs={[{ label: t('nav.creators') }]} title={t('creators.title')} highlight={t('creators.titleHighlight')} lead={t('creators.lead')} />
      <section aria-label={t('nav.creators')} className="container-site pt-6 pb-[var(--spacing-section)] md:pt-8">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-center lg:gap-6">
          <SearchField action="/creators" value={q} placeholder={t('creators.searchPlaceholder')} label={t('common.search')} keep={{ field }} />
          <FilterChips
            label={t('creators.allFields')}
            items={[
              { label: t('creators.allFields'), href: hrefWith('/creators', base, { field: undefined, page: undefined }), active: !field },
              ...fields.map((f) => ({ label: lang === 'en' ? f.nameEn : f.nameAr, href: hrefWith('/creators', base, { field: f.slug, page: undefined }), active: field === f.slug })),
            ]}
          />
        </div>
        {list.items.length === 0 ? (
          <div className="mt-8">
            <EmptyState title={filtering ? t('common.noResults') : t('common.empty')} action={filtering ? { href: '/creators', label: t('creators.allFields') } : undefined} />
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {list.items.map((c) => (
              <li key={c.id}>
                <CreatorCardView creator={c} lang={lang} />
              </li>
            ))}
          </ul>
        )}
        {list.hasMore && <LoadMore href={hrefWith('/creators', base, { page: String(page + 1) })} label={t('common.loadMore')} shown={list.items.length} total={list.total} />}
      </section>
      <CtaBand title={t('works.ctaTitle')} text={t('works.ctaText')} href="/submit" button={t('works.ctaButton')} />
    </>
  );
}
