import Link from 'next/link';
import { translate, type Lang } from '@/lib/i18n/dict';
import { formatDate } from '@/lib/dates';
import { isPublic } from '@/lib/publish';
import { creditName, type WorkCard, type WorkDetail } from '@/lib/queries/content';
import { appUrl } from '@/lib/tokens';
import { Breadcrumbs } from '@/components/site/PageIntro';
import { Media } from '@/components/site/Media';
import { DemoBadge, RichText, SectionTitle } from '@/components/site/Blocks';
import { Avatar, WorkCardView } from '@/components/site/Cards';
import { Gallery, VideoPlayer } from '@/components/site/Gallery';
import { ShareLinks } from '@/components/site/ShareLinks';
import { Arrow } from '@/components/site/Arrow';

const pickText = (lang: Lang, ar: string, en?: string | null) => (lang === 'en' && en ? { text: en, lang: 'en' as const } : { text: ar, lang: 'ar' as const });

export function WorkView({ work, related, lang, dir }: { work: WorkDetail; related: WorkCard[]; lang: Lang; dir: 'rtl' | 'ltr' }) {
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const title = pickText(lang, work.title, work.titleEn);
  const description = pickText(lang, work.description, work.descriptionEn);
  const people = work.creators.map((c) => ({ ...creditName(c.creator), display: lang === 'en' && c.creator.displayNameEn ? c.creator.displayNameEn : c.creator.displayName, creator: c.creator, role: c.role }));
  const images = (work.media.length ? work.media.map((m) => ({ ...m.asset, caption: m.caption })) : work.thumbnail ? [{ ...work.thumbnail, caption: null }] : []).map((a) => ({
    id: a.id, url: a.url, width: a.width, height: a.height, caption: a.caption, alt: (lang === 'en' ? a.altEn || a.altAr : a.altAr) ?? title.text,
  }));
  const issueVisible = work.issue && isPublic(work.issue);
  const details: Array<[string, React.ReactNode]> = [];
  if (work.year) details.push([t('works.year'), <span key="y" className="ltr-iso">{work.year}</span>]);
  if (work.tools) details.push([t('works.tools'), work.tools]);
  if (issueVisible && work.issue) {
    details.push([t('works.issue'), <Link key="i" href={`/issues/${work.issue.slug}`} className="text-orange-600 underline underline-offset-4 hover:text-orange">{pickText(lang, work.issue.title, work.issue.titleEn).text} — {pickText(lang, work.issue.theme, work.issue.themeEn).text}</Link>]);
  }
  if (work.collaborators) details.push([t('works.collaborators'), work.collaborators]);
  if (work.rights) details.push([t('works.rights'), work.rights]);
  if (work.publishedAt) details.push([t('common.published'),<time key="d" dateTime={work.publishedAt.toISOString()}>{formatDate(work.publishedAt, lang)}</time>]);

  return (
    <article>
      <div className="container-site pt-6 md:pt-8">
        <Breadcrumbs label={t('nav.breadcrumb')} crumbs={[{ label: t('nav.home'), href: '/' }, { label: t('nav.works'), href: '/works' }, { label: title.text }]} />
      </div>

      <div className="container-site mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0">
          {work.videoUrl ? (
            <VideoPlayer url={work.videoUrl} title={title.text} poster={work.thumbnail?.url} />
          ) : (
            <Gallery images={images} dir={dir} labels={{ enlarge: t('works.enlarge'), close: t('works.close'), next: t('common.next'), prev: t('common.prev'), imageOf: t('works.imageOf') }} />
          )}
          {work.videoUrl && images.length > 1 && (
            <div className="mt-4">
              <Gallery images={images} dir={dir} labels={{ enlarge: t('works.enlarge'), close: t('works.close'), next: t('common.next'), prev: t('common.prev'), imageOf: t('works.imageOf') }} />
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          {work.isDemo && <DemoBadge label={t('common.demo')} />}
          <p className="eyebrow mt-3">{lang === 'en' ? work.category.nameEn : work.category.nameAr}</p>
          <h1 className="mt-1 text-h1 font-bold text-navy" lang={title.lang}>
            {title.text}
          </h1>
          <p className="mt-2 text-[1.05rem] text-ink-muted">
            {people.map((p, i) => (
              <span key={p.creator.id}>
                {i > 0 && (lang === 'ar' ? '، ' : ', ')}
                {p.href ? (
                  <Link href={p.href} className="font-semibold text-navy hover:text-orange">
                    {p.display}
                  </Link>
                ) : (
                  p.display
                )}
              </span>
            ))}
          </p>
          {details.length > 0 && (
            <dl className="mt-6 divide-y divide-line border-y border-line text-[0.95rem]">
              {details.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-3">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="text-navy">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {work.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label={t('works.tags')}>
              {work.tags.map((tag) => (
                <li key={tag.id} className="rounded-full bg-chip px-3 py-1 text-[0.82rem] text-navy">
                  #{lang === 'en' && tag.nameEn ? tag.nameEn : tag.nameAr}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6">
            <ShareLinks url={appUrl(`/works/${work.slug}`)} title={title.text} labels={{ share: t('common.share'), copy: t('common.copyLink'), copied: t('common.copied') }} />
          </div>
        </div>
      </div>

      {description.text && (
        <section aria-labelledby="about-work" className="container-site mt-[var(--spacing-section)]">
          <div className="border-t border-line pt-8">
            <SectionTitle id="about-work">{t('works.description')}</SectionTitle>
            <RichText html={description.text} className="mt-5" lang={description.lang} />
          </div>
        </section>
      )}

      {people.some((p) => p.href) && (
        <section aria-label={t('works.creator')} className="container-site mt-[var(--spacing-section)]">
          <ul className="grid gap-4 md:grid-cols-2">
            {people.filter((p) => p.href).map((p) => {
              const bio = p.creator.bio ? pickText(lang, p.creator.bio, p.creator.bioEn) : null;
              return (
                <li key={p.creator.id} className="flex gap-4 bg-pink-50 p-5">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-full">
                    {p.creator.photo ? <Media asset={p.creator.photo} lang={lang} fill sizes="80px" className="object-cover" /> : <Avatar name={p.display} className="size-full" />}
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow">{t('works.creator')}</p>
                    <p className="text-lg font-bold text-navy">{p.display}</p>
                    {bio && (
                      <p className="mt-1 line-clamp-3 text-[0.92rem] text-ink-muted" lang={bio.lang}>
                        {bio.text}
                      </p>
                    )}
                    <Link href={p.href!} className="link-arrow mt-1">
                      {t('works.viewProfile')} <Arrow />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-works" className="container-site section">
          <SectionTitle id="related-works" action={<Link href={`/works?category=${work.category.slug}`} className="link-arrow">{t('common.viewAll')} <Arrow /></Link>}>
            {t('works.related')}
          </SectionTitle>
          <ul className="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((w) => (
              <li key={w.id}>
                <WorkCardView work={w} lang={lang} shape="wide" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
