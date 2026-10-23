import type { Metadata } from 'next';
import Link from 'next/link';
import { getT } from '@/lib/i18n/server';
import { db } from '@/lib/db';
import { categories, featuredArticle, listArticles, localizeArticle, type ArticleCard } from '@/lib/queries/content';
import { formatDate } from '@/lib/dates';
import { flatParams, hrefWith, pageNumber } from '@/lib/url';
import { stripHtml } from '@/lib/text';
import { isPublic } from '@/lib/publish';
import { Breadcrumbs } from '@/components/site/PageIntro';
import { FilterChips, SearchField } from '@/components/site/Filters';
import { CtaBand, EmptyState, LoadMore, SectionTitle } from '@/components/site/Blocks';
import { ArticleCardView } from '@/components/site/Cards';
import { Media, MediaPlaceholder } from '@/components/site/Media';
import { Arrow } from '@/components/site/Arrow';
import type { Lang } from '@/lib/i18n/dict';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t('articles.title')} ${t('articles.titleHighlight')}`, description: t('articles.lead') };
}

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t, lang } = await getT();
  const sp = flatParams(await searchParams);
  const page = pageNumber(sp.page);
  const q = sp.q?.trim().slice(0, 100) || undefined;
  const cats = await categories('ARTICLE');
  const category = cats.find((c) => c.slug === sp.category)?.slug;
  const filtering = !!(q || category);
  const base = { q, category };

  const featured = filtering ? null : await featuredArticle();
  const exclude = featured ? [featured.id] : [];
  const latest = filtering ? null : await listArticles({ take: 3, excludeIds: exclude });
  const restExclude = [...exclude, ...(latest?.items.map((a) => a.id) ?? [])];
  const list = await listArticles({ q, category, page, excludeIds: filtering ? [] : restExclude });
  const quote = featured ? await pullQuote(featured.id) : null;

  return (
    <>
      <div className="relative overflow-x-clip">
        {/* علامة الاقتباس النعناعية الكبيرة */}
        <span aria-hidden className="pointer-events-none absolute -top-6 end-[4%] font-serif text-[clamp(10rem,22vw,19rem)] leading-none text-mint select-none">
          {lang === 'ar' ? '”' : '“'}
        </span>
        <div className="container-site relative pt-6 pb-2 md:pt-8">
          <Breadcrumbs label={t('nav.breadcrumb')} crumbs={[{ label: t('nav.home'), href: '/' }, { label: t('nav.articles') }]} />
          <h1 className="mt-4 text-h1 font-bold text-navy">
            {t('articles.title')} <span className="text-orange">{t('articles.titleHighlight')}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[length:clamp(1.05rem,1.6vw,1.3rem)] leading-[1.8] text-navy/90">{t('articles.lead')}</p>
        </div>
      </div>

      <div className="container-site mt-6 grid gap-3 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-center lg:gap-6">
        <SearchField action="/articles" value={q} placeholder={t('articles.searchPlaceholder')} label={t('common.search')} keep={{ category }} />
        <FilterChips
          label={t('articles.filter')}
          items={[
            { label: t('common.all'), href: hrefWith('/articles', base, { category: undefined, page: undefined }), active: !category },
            ...cats.map((c) => ({ label: lang === 'en' ? c.nameEn : c.nameAr, href: hrefWith('/articles', base, { category: c.slug, page: undefined }), active: category === c.slug })),
          ]}
        />
      </div>

      {featured && <Featured article={featured} lang={lang} label={t('articles.featured')} cta={t('articles.read')} minutes={t('common.minutes')} />}

      {latest && latest.items.length > 0 && (
        <section aria-labelledby="latest-title" className="container-site section">
          <SectionTitle id="latest-title">{t('articles.latest')}</SectionTitle>
          <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {latest.items.map((a) => (
              <li key={a.id}>
                <ArticleCardView article={a} lang={lang} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {quote && (
        <section aria-label={t('articles.featured')} className="relative overflow-hidden bg-navy text-white">
          <div className="container-site flex flex-col items-center gap-4 py-12 text-center md:py-14">
            <span aria-hidden className="font-serif text-7xl leading-none text-mint">”</span>
            <blockquote className="max-w-3xl text-[length:clamp(1.3rem,2.4vw,1.9rem)] leading-[1.7] font-semibold" lang={quote.lang}>
              {quote.text}
            </blockquote>
            <Link href={`/articles/${quote.slug}`} className="link-arrow text-orange">
              {quote.title} <Arrow />
            </Link>
          </div>
        </section>
      )}

      <section aria-labelledby="more-title" className="container-site section">
        <SectionTitle id="more-title">{filtering ? t('articles.results') : t('articles.more')}</SectionTitle>
        {list.items.length === 0 ? (
          <div className="mt-8">
            <EmptyState title={filtering ? t('common.noResults') : t('common.empty')} action={filtering ? { href: '/articles', label: t('common.all') } : undefined} />
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {list.items.map((a) => (
              <li key={a.id}>
                <ArticleRow article={a} lang={lang} minutes={t('common.minutes')} />
              </li>
            ))}
          </ul>
        )}
        {list.hasMore && <LoadMore href={hrefWith('/articles', base, { page: String(page + 1) })} label={t('common.loadMore')} shown={list.items.length} total={list.total} />}
      </section>

      <CtaBand title={t('articles.ctaTitle')} text={t('articles.ctaText')} href="/submit?type=writing" button={t('articles.ctaButton')} />
    </>
  );
}

function names(a: ArticleCard, lang: Lang) {
  return a.authors.map((x) => (lang === 'en' && x.creator.displayNameEn ? x.creator.displayNameEn : x.creator.displayName)).join(lang === 'ar' ? '، ' : ', ');
}

function Featured({ article, lang, label, cta, minutes }: { article: ArticleCard; lang: Lang; label: string; cta: string; minutes: string }) {
  const loc = localizeArticle(article, lang);
  return (
    <section aria-labelledby="featured-title" className="container-site mt-8 md:mt-10">
      <div className="grid md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="relative aspect-[16/10] overflow-hidden bg-mint-25 md:aspect-auto md:min-h-[24rem]">
          {article.cover ? <Media asset={article.cover} lang={lang} fill priority sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" /> : <MediaPlaceholder className="absolute inset-0" />}
        </div>
        <div className="flex flex-col justify-center bg-mint-40 p-6 text-center sm:p-8 md:text-start lg:p-10">
          <p className="eyebrow">{label}</p>
          <h2 id="featured-title" className="mt-2 text-[length:clamp(1.6rem,2.8vw,2.3rem)] font-bold text-navy" lang={loc.lang}>
            {loc.title}
          </h2>
          <p className="mt-3 text-[1.02rem] leading-[1.85] text-navy/90" lang={loc.lang}>
            {loc.excerpt}
          </p>
          <p className="mt-4 text-[0.88rem] text-ink-muted">
            {names(article, lang)} · <time dateTime={article.publishedAt?.toISOString()}>{formatDate(article.publishedAt, lang)}</time> ·{' '}
            <span className="ltr-iso">{article.readingMinutes}</span> {minutes}
          </p>
          <Link href={`/articles/${loc.slug}`} className="btn btn-primary mt-6 self-center md:self-start">
            {cta} <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ArticleRow({ article, lang, minutes }: { article: ArticleCard; lang: Lang; minutes: string }) {
  const loc = localizeArticle(article, lang);
  return (
    <article className="group relative grid grid-cols-[minmax(0,1fr)_6.5rem] gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_11rem] sm:gap-6">
      <div className="min-w-0">
        <p className="eyebrow">{lang === 'en' ? article.category.nameEn : article.category.nameAr}</p>
        <h3 className="card-title mt-0.5" lang={loc.lang}>
          <Link href={`/articles/${loc.slug}`} className="after:absolute after:inset-0 group-hover:text-orange">
            {loc.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-[0.92rem] text-ink-muted" lang={loc.lang}>
          {loc.excerpt}
        </p>
        <p className="mt-2 text-[0.8rem] text-ink-muted">
          {names(article, lang)} · <time dateTime={article.publishedAt?.toISOString()}>{formatDate(article.publishedAt, lang)}</time> · <span className="ltr-iso">{article.readingMinutes}</span> {minutes}
        </p>
      </div>
      <div className="relative aspect-[4/3] self-start overflow-hidden bg-mint-25">
        {article.cover ? <Media asset={article.cover} lang={lang} fill sizes="176px" className="object-cover" /> : <MediaPlaceholder className="absolute inset-0" />}
      </div>
    </article>
  );
}

/** أول اقتباس في المقال المختار (بلغة الواجهة إن وُجدت ترجمة). */
async function pullQuote(articleId: string) {
  const { lang } = await getT();
  const a = await db.article.findUnique({ where: { id: articleId }, select: { slug: true, title: true, bodyHtml: true, lang: true, translation: { select: { slug: true, title: true, bodyHtml: true, lang: true, status: true, publishedAt: true } } } });
  if (!a) return null;
  const src = lang === 'en' && a.translation && isPublic(a.translation) ? a.translation : a;
  const m = src.bodyHtml.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/);
  if (!m) return null;
  return { text: stripHtml(m[1]), slug: src.slug, title: src.title, lang: src.lang };
}
