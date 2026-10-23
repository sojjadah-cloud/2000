import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/server';
import { categories, listWorks } from '@/lib/queries/content';
import { flatParams, hrefWith, pageNumber } from '@/lib/url';
import { PageIntro } from '@/components/site/PageIntro';
import { FilterChips, SearchField } from '@/components/site/Filters';
import { SelectNav } from '@/components/site/SelectNav';
import { CtaBand, EmptyState, LoadMore } from '@/components/site/Blocks';
import { WorkCardView, type WorkShape } from '@/components/site/Cards';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t('works.title')} ${t('works.titleHighlight')}`, description: t('works.lead') };
}

// إيقاع الشبكة كما في المرجع: 3 طولية، 3 عريضة، ثم صفّ من بطاقتين بعرضين مختلفين
const PATTERN: Array<{ shape: WorkShape; span: string; sizes: string }> = [
  ...Array(3).fill({ shape: 'tall', span: 'lg:col-span-4', sizes: '(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw' }),
  ...Array(3).fill({ shape: 'wide', span: 'lg:col-span-4', sizes: '(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw' }),
  { shape: 'banner2', span: 'sm:col-span-2 lg:col-span-5', sizes: '(min-width: 1024px) 560px, 100vw' },
  { shape: 'banner', span: 'sm:col-span-2 lg:col-span-7', sizes: '(min-width: 1024px) 720px, 100vw' },
];

export default async function WorksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t, lang } = await getT();
  const sp = flatParams(await searchParams);
  const page = pageNumber(sp.page);
  const q = sp.q?.trim().slice(0, 100) || undefined;
  const sort = sp.sort === 'old' ? 'old' : 'new';
  const cats = await categories('WORK');
  const category = cats.find((c) => c.slug === sp.category)?.slug;
  const list = await listWorks({ q, category, sort, page });
  const base = { q, category, sort: sort === 'old' ? 'old' : undefined };
  const filtering = !!(q || category);

  return (
    <>
      <PageIntro crumbs={[{ label: t('nav.works') }]} title={t('works.title')} highlight={t('works.titleHighlight')} lead={t('works.lead')} />

      <section className="container-site pt-6 pb-[var(--spacing-section)] md:pt-8" aria-label={t('nav.works')}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-4">
          <SearchField action="/works" value={q} placeholder={t('works.searchPlaceholder')} label={t('common.search')} keep={{ category, sort: base.sort }} className="lg:max-w-[18rem]" />
          <FilterChips
            label={t('works.filterCategory')}
            items={[
              { label: t('common.all'), href: hrefWith('/works', base, { category: undefined, page: undefined }), active: !category },
              ...cats.map((c) => ({ label: lang === 'en' ? c.nameEn : c.nameAr, href: hrefWith('/works', base, { category: c.slug, page: undefined }), active: category === c.slug })),
            ]}
          />
          <SelectNav
            label={t('works.sortLabel')}
            value={sort}
            className="sm:w-44"
            options={[
              { label: t('common.newest'), value: 'new', href: hrefWith('/works', base, { sort: undefined, page: undefined }) },
              { label: t('common.oldest'), value: 'old', href: hrefWith('/works', base, { sort: 'old', page: undefined }) },
            ]}
          />
        </div>

        {list.items.length === 0 ? (
          <div className="mt-8">
            <EmptyState title={filtering ? t('common.noResults') : t('common.empty')} action={filtering ? { href: '/works', label: t('common.all') } : undefined} />
          </div>
        ) : (
          <ul className="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-12">
            {list.items.map((w, i) => {
              const p = PATTERN[i % PATTERN.length];
              return (
                <li key={w.id} className={p.span}>
                  <WorkCardView work={w} lang={lang} shape={p.shape} sizes={p.sizes} />
                </li>
              );
            })}
          </ul>
        )}
        {list.hasMore && <LoadMore href={hrefWith('/works', base, { page: String(page + 1) })} label={t('common.loadMore')} shown={list.items.length} total={list.total} />}
      </section>

      <CtaBand title={t('works.ctaTitle')} text={t('works.ctaText')} href="/submit" button={t('works.ctaButton')} />
    </>
  );
}
