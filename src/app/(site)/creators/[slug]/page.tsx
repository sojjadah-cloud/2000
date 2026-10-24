import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Globe, MapPin } from 'lucide-react';
import { getT, pick } from '@/lib/i18n/server';
import { getCreator } from '@/lib/queries/content';
import { appUrl } from '@/lib/tokens';
import { Breadcrumbs } from '@/components/site/PageIntro';
import { Media } from '@/components/site/Media';
import { SectionTitle } from '@/components/site/Blocks';
import { ArticleCardView, Avatar, EventCardView, IssueCardView, WorkCardView } from '@/components/site/Cards';
import { ShareLinks } from '@/components/site/ShareLinks';
import { SocialIcon } from '@/components/site/SocialIcon';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await getT();
  const c = await getCreator(decodeURIComponent(slug));
  if (!c) return {};
  const name = pick(lang, c.displayName, c.displayNameEn).text;
  const bio = c.bio ? pick(lang, c.bio, c.bioEn).text : undefined;
  return { title: name, description: bio, openGraph: { title: name, description: bio, images: c.photo ? [c.photo.url] : undefined } };
}

export default async function CreatorPage({ params }: Props) {
  const { slug } = await params;
  const { t, lang } = await getT();
  const c = await getCreator(decodeURIComponent(slug));
  if (!c) notFound();
  const name = pick(lang, c.displayName, c.displayNameEn);
  const headline = c.headline ? pick(lang, c.headline, c.headlineEn) : null;
  const bio = c.bio ? pick(lang, c.bio, c.bioEn) : null;
  const quote = c.quote ? pick(lang, c.quote, c.quoteEn) : null;
  // روابط مصرح بنشرها فقط (يحددها الفريق عند اعتماد الملف)
  const links = Array.isArray(c.socialLinks) ? (c.socialLinks as Array<{ platform?: string; label?: string; url: string }>).filter((l) => typeof l?.url === 'string' && /^https?:\/\//.test(l.url)) : [];

  return (
    <article>
      <div className="container-site pt-6 md:pt-8">
        <Breadcrumbs label={t('nav.breadcrumb')} crumbs={[{ label: t('nav.home'), href: '/' }, { label: t('nav.creators'), href: '/creators' }, { label: name.text }]} />
      </div>

      <header className="container-site mt-6">
        <div className="grid items-center gap-6 bg-pink-50 p-6 text-center sm:p-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10 md:text-start lg:p-10">
          <div className="relative mx-auto size-40 overflow-hidden rounded-full sm:size-48 md:mx-0">
            {c.photo ? <Media asset={c.photo} lang={lang} fill priority sizes="192px" className="object-cover" /> : <Avatar name={name.text} className="size-full text-[1.6rem]" />}
          </div>
          <div>
            <h1 className="text-h1 font-bold text-navy" lang={name.lang}>
              {name.text}
            </h1>
            {headline && (
              <p className="mt-1 text-[1.15rem] font-medium text-navy" lang={headline.lang}>
                {headline.text}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {c.fields.map((f) => (
                <Link key={f.id} href={`/creators?field=${f.slug}`} className="rounded-full bg-white px-3 py-1 text-[0.85rem] text-navy hover:text-orange">
                  {lang === 'en' ? f.nameEn : f.nameAr}
                </Link>
              ))}
              {c.city && (
                <span className="inline-flex items-center gap-1 text-[0.88rem] text-ink-muted">
                  <MapPin aria-hidden size={15} /> {c.city}
                </span>
              )}
              {c.openToCollab && <span className="rounded-full bg-orange px-3 py-1 text-[0.82rem] font-semibold text-white">{t('creators.openToCollab')}</span>}
            </div>
            {quote && (
              <blockquote className="mt-5 max-w-2xl text-[1.02rem] leading-[1.85] text-ink-muted" lang={quote.lang}>
                &ldquo;{quote.text}&rdquo;
              </blockquote>
            )}
          </div>
        </div>
      </header>

      <div className="container-site mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          {bio && (
            <p className="max-w-[var(--container-read)] text-[1.08rem] leading-[2] text-navy" lang={bio.lang}>
              {bio.text}
            </p>
          )}
        </div>
        <aside className="space-y-4">
          {(c.website || links.length > 0) && (
            <div className="border border-line bg-white p-5">
              <p className="font-bold text-navy">{t('creators.links')}</p>
              <ul className="mt-3 space-y-2">
                {c.website && (
                  <li>
                    <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-orange-600 hover:underline">
                      <Globe aria-hidden size={18} /> <span className="ltr-iso break-all">{c.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  </li>
                )}
                {links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-navy hover:text-orange">
                      <SocialIcon platform={l.platform ?? 'web'} /> {l.label ?? l.platform}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ShareLinks url={appUrl(`/creators/${c.slug}`)} title={name.text} labels={{ share: t('common.share'), copy: t('common.copyLink'), copied: t('common.copied') }} />
        </aside>
      </div>

      {c.works.length > 0 && (
        <section aria-labelledby="c-works" className="container-site section">
          <SectionTitle id="c-works">{t('creators.works')}</SectionTitle>
          <ul className="mt-6 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {c.works.map(({ work }) => (
              <li key={work.id}>
                <WorkCardView work={work} lang={lang} shape="wide" />
              </li>
            ))}
          </ul>
        </section>
      )}
      {c.articles.length > 0 && (
        <section aria-labelledby="c-writing" className="container-site pb-[var(--spacing-section)]">
          <SectionTitle id="c-writing">{t('creators.writings')}</SectionTitle>
          <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {c.articles.map(({ article }) => (
              <li key={article.id}>
                <ArticleCardView article={article} lang={lang} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {c.issues.length > 0 && (
        <section aria-labelledby="c-issues" className="container-site pb-[var(--spacing-section)]">
          <SectionTitle id="c-issues">{t('creators.issues')}</SectionTitle>
          <ul className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {c.issues.map(({ issue, role }) => (
              <li key={issue.id}>
                <IssueCardView issue={issue} lang={lang} />
                <p className="mt-2 text-sm text-ink-muted">{role}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {c.events.length > 0 && (
        <section aria-labelledby="c-events" className="container-site pb-[var(--spacing-section)]">
          <SectionTitle id="c-events">{t('creators.events')}</SectionTitle>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {c.events.map(({ event }) => (
              <li key={event.id}>
                <EventCardView event={event} lang={lang} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
