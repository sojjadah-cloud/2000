import Link from 'next/link';
import { Languages } from 'lucide-react';
import { translate, type Lang } from '@/lib/i18n/dict';
import { formatDate } from '@/lib/dates';
import { isPublic } from '@/lib/publish';
import { withHeadingIds } from '@/lib/sanitize';
import { creditName, type ArticleCard, type ArticleDetail } from '@/lib/queries/content';
import { appUrl } from '@/lib/tokens';
import { Breadcrumbs } from '@/components/site/PageIntro';
import { Media } from '@/components/site/Media';
import { RichText, SectionTitle } from '@/components/site/Blocks';
import { ArticleCardView, Avatar } from '@/components/site/Cards';
import { ShareLinks } from '@/components/site/ShareLinks';
import { Arrow } from '@/components/site/Arrow';

export function ArticleView({ article, related, lang }: { article: ArticleDetail; related: ArticleCard[]; lang: Lang }) {
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const { html, headings } = withHeadingIds(article.bodyHtml);
  const isPoem = article.category.slug === 'poetry';
  const showToc = !isPoem && headings.length >= 3;
  const contentDir = article.lang === 'en' ? 'ltr' : 'rtl';
  const updated = article.updatedAt.getTime() - (article.publishedAt?.getTime() ?? 0) > 86_400_000;
  // المادة المقابلة بلغة أخرى، إن كانت منشورة
  const other = article.translation && isPublic(article.translation) ? article.translation : article.translationOf && isPublic(article.translationOf) ? article.translationOf : null;
  const cover = article.cover;
  const largeCover = cover && (cover.width ?? 0) >= 480;
  const authors = article.authors.map((a) => ({ ...creditName(a.creator), display: lang === 'en' && a.creator.displayNameEn ? a.creator.displayNameEn : a.creator.displayName, creator: a.creator, role: a.role }));
  const issueVisible = article.issue && isPublic(article.issue);

  return (
    <article lang={article.lang} dir={contentDir}>
      <div className="container-site pt-6 md:pt-8" lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Breadcrumbs label={t('nav.breadcrumb')} crumbs={[{ label: t('nav.home'), href: '/' }, { label: t('nav.articles'), href: '/articles' }, { label: article.title }]} />
      </div>

      <header className="container-site mt-6 max-w-[56rem] text-center">
        <p className="eyebrow">{article.lang === 'en' ? article.category.nameEn : article.category.nameAr}</p>
        <h1 className="mt-2 text-h1 font-bold text-navy">{article.title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-[length:clamp(1.1rem,1.8vw,1.3rem)] leading-[1.85] text-navy/85">{article.excerpt}</p>
        <p className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.92rem] text-ink-muted">
          <span>
            {translate(article.lang === 'en' ? 'en' : 'ar', 'common.by')}{' '}
            {authors.map((a, i) => (
              <span key={a.creator.id}>
                {i > 0 && (article.lang === 'en' ? ', ' : '، ')}
                {a.href ? (
                  <Link href={a.href} className="font-semibold text-navy hover:text-orange">
                    {a.display}
                  </Link>
                ) : (
                  <span className="font-semibold text-navy">{a.display}</span>
                )}
              </span>
            ))}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={article.publishedAt?.toISOString()}>{formatDate(article.publishedAt, article.lang === 'en' ? 'en' : 'ar')}</time>
          <span aria-hidden>·</span>
          <span>
            <span className="ltr-iso">{article.readingMinutes}</span> {translate(article.lang === 'en' ? 'en' : 'ar', 'common.minutes')}
          </span>
          {updated && (
            <>
              <span aria-hidden>·</span>
              <span>
                {translate(article.lang === 'en' ? 'en' : 'ar', 'articles.updated')}: <time dateTime={article.updatedAt.toISOString()}>{formatDate(article.updatedAt, article.lang === 'en' ? 'en' : 'ar')}</time>
              </span>
            </>
          )}
        </p>
        {other && (
          <p className="mt-4">
            <Link href={`/articles/${other.slug}`} lang={other.lang} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-mint-25 px-4 text-[0.9rem] font-semibold text-navy hover:text-orange">
              <Languages aria-hidden size={17} />
              {other.lang === 'en' ? 'Read in English' : 'اقرأ بالعربية'}
            </Link>
          </p>
        )}
      </header>

      {cover && (
        <figure className={`container-site mt-8 ${largeCover ? 'max-w-[64rem]' : 'max-w-[44rem]'}`}>
          <div className="relative overflow-hidden bg-mint-25">
            <Media asset={cover} lang={lang} priority sizes="(min-width: 1024px) 1000px, 100vw" className="h-auto w-full" />
          </div>
          {(cover.credit || cover.rights) && (
            <figcaption className="mt-2 text-[0.82rem] text-ink-soft">
              {translate(article.lang === 'en' ? 'en' : 'ar', 'articles.coverCredit')}: {[cover.credit, cover.rights].filter(Boolean).join(' — ')}
            </figcaption>
          )}
        </figure>
      )}

      <div className={`container-site mt-10 grid gap-10 ${showToc ? 'lg:grid-cols-[14rem_minmax(0,44rem)] lg:justify-center' : 'justify-items-center'}`}>
        {showToc && (
          <nav aria-label={translate(article.lang === 'en' ? 'en' : 'ar', 'articles.toc')} className="lg:sticky lg:top-28 lg:self-start">
            <details open className="rounded border border-line bg-white p-4 lg:border-0 lg:p-0">
              <summary className="cursor-pointer font-bold text-navy lg:cursor-default">{translate(article.lang === 'en' ? 'en' : 'ar', 'articles.toc')}</summary>
              <ol className="mt-3 space-y-2 border-s-2 border-line ps-4 text-[0.92rem]">
                {headings.map((h) => (
                  <li key={h.id} className={h.level === 3 ? 'ps-3' : ''}>
                    <a href={`#${h.id}`} className="text-ink-muted hover:text-orange">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          </nav>
        )}
        <div className="w-full max-w-[var(--container-read)] min-w-0">
          <RichText html={html} poem={isPoem} className="mx-auto" />

          {article.sources && (
            <section aria-labelledby="sources-title" className="mt-10 border-t border-line pt-6">
              <h2 id="sources-title" className="text-lg font-bold text-navy">
                {translate(article.lang === 'en' ? 'en' : 'ar', 'articles.sources')}
              </h2>
              <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-[0.92rem] text-ink-muted">
                {article.sources.split('\n').filter(Boolean).map((s, i) => (
                  <li key={i} dir="auto">
                    {/^https?:\/\//.test(s.trim()) ? (
                      <a href={s.trim()} target="_blank" rel="noopener noreferrer" className="ltr-iso break-all text-orange-600 underline">
                        {s.trim()}
                      </a>
                    ) : (
                      s
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {issueVisible && article.issue && (
            <p className="mt-8 text-[0.95rem] text-ink-muted">
              {translate(article.lang === 'en' ? 'en' : 'ar', 'works.issue')}:{' '}
              <Link href={`/issues/${article.issue.slug}`} className="font-semibold text-navy underline underline-offset-4 hover:text-orange">
                {article.lang === 'en' && article.issue.titleEn ? article.issue.titleEn : article.issue.title}
              </Link>
            </p>
          )}

          {article.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <li key={tag.id} className="rounded-full bg-chip px-3 py-1 text-[0.82rem] text-navy">
                  #{article.lang === 'en' && tag.nameEn ? tag.nameEn : tag.nameAr}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 border-t border-line pt-6">
            <ShareLinks url={appUrl(`/articles/${article.slug}`)} title={article.title} labels={{ share: t('common.share'), copy: t('common.copyLink'), copied: t('common.copied') }} />
          </div>

          {authors.filter((a) => a.href).map((a) => {
            const bio = article.lang === 'en' ? a.creator.bioEn || a.creator.bio : a.creator.bio;
            return (
              <aside key={a.creator.id} aria-label={translate(article.lang === 'en' ? 'en' : 'ar', 'articles.aboutAuthor')} className="mt-8 flex gap-4 bg-pink-50 p-5">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-full">
                  {a.creator.photo ? <Media asset={a.creator.photo} lang={lang} fill sizes="64px" className="object-cover" /> : <Avatar name={a.display} className="size-full text-[0.8rem]" />}
                </div>
                <div className="min-w-0">
                  <p className="eyebrow">{translate(article.lang === 'en' ? 'en' : 'ar', 'articles.aboutAuthor')}</p>
                  <p className="text-lg font-bold text-navy">{a.display}</p>
                  {bio && <p className="mt-1 text-[0.92rem] text-ink-muted">{bio}</p>}
                  <Link href={a.href!} className="link-arrow">
                    {translate(article.lang === 'en' ? 'en' : 'ar', 'works.viewProfile')} <Arrow />
                  </Link>
                </div>
              </aside>
            );
          })}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-articles" className="container-site section" lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="border-t border-line pt-8">
            <SectionTitle id="related-articles">{t('articles.related')}</SectionTitle>
            <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <ArticleCardView article={r} lang={lang} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
