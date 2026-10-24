import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { getT } from '@/lib/i18n/server';
import { hashToken } from '@/lib/tokens';
import { confirmSubscription } from '@/lib/actions/newsletter';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ConfirmPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { token } = await params;
  const sp = await searchParams;
  const { t, lang } = await getT();
  const pending = !sp.done && (await db.subscriber.findUnique({ where: { confirmTokenHash: hashToken(token) }, select: { id: true } }));
  return (
    <div className="container-site max-w-xl py-14 text-center">
      <div className="border border-line bg-white p-8">
        {sp.done ? (
          <>
            <CheckCircle2 aria-hidden size={52} className="mx-auto text-[#1f8f5f]" />
            <h1 className="mt-4 text-h2 font-bold text-navy">{t('newsletter.confirmed')}</h1>
          </>
        ) : pending ? (
          <>
            <MailCheck aria-hidden size={52} className="mx-auto text-orange" />
            <h1 className="mt-4 text-h2 font-bold text-navy">{lang === 'ar' ? 'تأكيد الاشتراك في نشرة ألفين' : 'Confirm your Alfeen subscription'}</h1>
            <form action={confirmSubscription} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn btn-primary">
                {lang === 'ar' ? 'تأكيد الاشتراك' : 'Confirm subscription'}
              </button>
            </form>
          </>
        ) : (
          <>
            <XCircle aria-hidden size={52} className="mx-auto text-burgundy" />
            <h1 className="mt-4 text-h2 font-bold text-navy">{t('newsletter.invalid')}</h1>
          </>
        )}
        <Link href="/" className="link-arrow mt-6 justify-center">
          {t('common.backHome')}
        </Link>
      </div>
    </div>
  );
}
