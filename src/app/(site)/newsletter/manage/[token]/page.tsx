import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getT } from '@/lib/i18n/server';
import { hashToken } from '@/lib/tokens';
import { setSubscription } from '@/lib/actions/newsletter';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ManagePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { token } = await params;
  const sp = await searchParams;
  const { t, lang } = await getT();
  const tx = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const sub = await db.subscriber.findUnique({ where: { manageTokenHash: hashToken(token) }, select: { email: true, status: true } });
  if (!sub) notFound();
  const statusLabel = sub.status === 'CONFIRMED' ? tx('مشترك ومؤكد', 'Subscribed') : sub.status === 'PENDING' ? tx('بانتظار التأكيد', 'Awaiting confirmation') : tx('غير مشترك', 'Unsubscribed');
  return (
    <div className="container-site max-w-xl py-14">
      <div className="border border-line bg-white p-8 text-center">
        <h1 className="text-h2 font-bold text-navy">{t('newsletter.manage')}</h1>
        <p className="ltr-iso mt-3 text-ink-muted">{sub.email}</p>
        <p className="mt-2">
          <span className="rounded-full bg-chip px-4 py-1.5 font-semibold text-navy">{statusLabel}</span>
        </p>
        {sp.updated && (
          <p role="status" className="mt-4 rounded bg-mint-25 px-4 py-3 text-navy">
            {sp.updated === 'unsubscribe' ? t('newsletter.unsubscribed') : tx('أُعيد تفعيل اشتراكك.', 'Your subscription is active again.')}
          </p>
        )}
        <form action={setSubscription} className="mt-6">
          <input type="hidden" name="token" value={token} />
          {sub.status === 'UNSUBSCRIBED' ? (
            <button name="action" value="resubscribe" className="btn btn-primary">
              {tx('إعادة الاشتراك', 'Resubscribe')}
            </button>
          ) : (
            <button name="action" value="unsubscribe" className="btn btn-outline">
              {tx('إلغاء الاشتراك', 'Unsubscribe')}
            </button>
          )}
        </form>
        <Link href="/" className="link-arrow mt-6 justify-center">
          {t('common.backHome')}
        </Link>
      </div>
    </div>
  );
}
