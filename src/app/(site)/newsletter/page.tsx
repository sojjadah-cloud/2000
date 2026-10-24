import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getT } from '@/lib/i18n/server';
import { getSettings } from '@/lib/queries/settings';
import { formatDate } from '@/lib/dates';
import { PageIntro } from '@/components/site/PageIntro';
import { EmptyState } from '@/components/site/Blocks';
import { Arrow } from '@/components/site/Arrow';

export const metadata: Metadata = { title: 'أرشيف النشرات' };

/** أرشيف النشرات المرسلة — يظهر فقط عند تفعيله من الإعدادات. */
export default async function NewsletterArchive() {
  const { t, lang } = await getT();
  const settings = await getSettings();
  if (!settings.newsletterArchiveEnabled) notFound();
  const items = await db.newsletter.findMany({ where: { archived: true, sentAt: { not: null } }, orderBy: { sentAt: 'desc' }, take: 50 });
  return (
    <>
      <PageIntro crumbs={[{ label: t('newsletter.archive') }]} title={t('newsletter.archive')} />
      <div className="container-site max-w-3xl pt-6 pb-[var(--spacing-section)]">
        {items.length === 0 ? (
          <EmptyState title={t('common.empty')} />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {items.map((n) => (
              <li key={n.id}>
                <Link href={`/newsletter/${n.slug}`} className="group flex items-center justify-between gap-4 py-4">
                  <span>
                    <span className="block font-bold text-navy group-hover:text-orange">{n.subject}</span>
                    <time className="text-sm text-ink-muted">{formatDate(n.sentAt, lang)}</time>
                  </span>
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
