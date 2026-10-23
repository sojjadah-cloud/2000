import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getT, pick } from '@/lib/i18n/server';
import { getIssue } from '@/lib/queries/content';
import { PdfReader } from '@/components/site/PdfReader';
import { Breadcrumbs } from '@/components/site/PageIntro';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang, t } = await getT();
  const issue = await getIssue(decodeURIComponent(slug));
  return issue ? { title: `${t('reader.title')} — ${pick(lang, issue.title, issue.titleEn).text}` } : {};
}

export default async function ReadIssuePage({ params }: Props) {
  const { slug } = await params;
  const { t, lang, dir } = await getT();
  const issue = await getIssue(decodeURIComponent(slug));
  if (!issue) notFound();
  const title = pick(lang, issue.title, issue.titleEn).text;
  return (
    <div className="container-site py-6 md:py-8">
      <Breadcrumbs
        label={t('nav.breadcrumb')}
        crumbs={[{ label: t('nav.home'), href: '/' }, { label: t('nav.issues'), href: '/issues' }, { label: title, href: `/issues/${issue.slug}` }, { label: t('reader.title') }]}
      />
      <h1 className="mt-3 text-h2 font-bold text-navy">
        {title} <span className="text-orange">{pick(lang, issue.theme, issue.themeEn).text}</span>
      </h1>
      <div className="mt-5 -mx-[var(--spacing-gutter)] sm:mx-0">
        {issue.pdf ? (
          <PdfReader
            url={issue.pdf.url}
            dir={dir}
            labels={{
              loading: t('reader.loading'), error: t('reader.error'), open: t('reader.openFile'), zoomIn: t('reader.zoomIn'), zoomOut: t('reader.zoomOut'),
              fullscreen: t('reader.fullscreen'), exitFullscreen: t('reader.exitFullscreen'), next: t('common.next'), prev: t('common.prev'),
              page: t('common.page'), of: t('common.of'), title: t('reader.title'),
            }}
          />
        ) : (
          <div className="rounded bg-chip p-8 text-center">
            <p>{t('issues.noPdf')}</p>
            <Link href={`/issues/${issue.slug}`} className="btn btn-outline mt-4">
              {title}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
