import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getT } from '@/lib/i18n/server';
import { getSettings } from '@/lib/queries/settings';
import { formatDate } from '@/lib/dates';
import { Breadcrumbs } from '@/components/site/PageIntro';
import { RichText } from '@/components/site/Blocks';

export default async function NewsletterIssue({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t, lang } = await getT();
  const settings = await getSettings();
  if (!settings.newsletterArchiveEnabled) notFound();
  const n = await db.newsletter.findFirst({ where: { slug: decodeURIComponent(slug), archived: true, sentAt: { not: null } } });
  if (!n) notFound();
  return (
    <article className="container-site max-w-3xl py-8 md:py-10">
      <Breadcrumbs label={t('nav.breadcrumb')} crumbs={[{ label: t('nav.home'), href: '/' }, { label: t('newsletter.archive'), href: '/newsletter' }, { label: n.subject }]} />
      <h1 className="mt-4 text-h1 font-bold text-navy">{n.subject}</h1>
      <time className="mt-2 block text-ink-muted">{formatDate(n.sentAt, lang)}</time>
      <RichText html={n.bodyHtml} className="mt-8" lang="ar" />
    </article>
  );
}
