import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FileText, Link2 } from 'lucide-react';
import { db } from '@/lib/db';
import { getT } from '@/lib/i18n/server';
import { hashToken } from '@/lib/tokens';
import { formatDate } from '@/lib/dates';
import { SUBMISSION_TYPES } from '@/lib/submissions';
import { RevisionForm } from '@/components/site/RevisionForm';
import type { DictKey } from '@/lib/i18n/dict';

export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'متابعة المشاركة' };

const TONE: Record<string, string> = {
  RECEIVED: 'bg-chip text-navy',
  IN_REVIEW: 'bg-yellow-50 text-navy',
  NEEDS_CHANGES: 'bg-pink-50 text-burgundy',
  ACCEPTED: 'bg-mint text-navy',
  DECLINED: 'bg-chip text-ink-muted',
  PUBLISHED: 'bg-[#1f8f5f] text-white',
};

/** متابعة آمنة بالرابط الخاص فقط؛ لا تُعرض ملاحظات الفريق الداخلية ولا الملفات نفسها. */
export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { t, lang } = await getT();
  const tx = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const sub = await db.submission.findUnique({
    where: { trackingTokenHash: hashToken(token) },
    select: {
      code: true, title: true, type: true, status: true, createdAt: true, messageToSubmitter: true,
      history: { orderBy: { createdAt: 'asc' }, select: { id: true, toStatus: true, createdAt: true, actor: true } },
      revisions: { orderBy: { number: 'asc' }, select: { id: true, number: true, createdAt: true, privateLink: true, note: true, files: { select: { id: true, originalName: true, size: true } } } },
    },
  });
  if (!sub) notFound();
  const typeLabel = SUBMISSION_TYPES.find((x) => x.value === sub.type)?.[lang] ?? sub.type;

  return (
    <div className="container-site max-w-3xl py-10 md:py-14">
      <h1 className="text-h2 font-bold text-navy">{t('track.title')}</h1>
      <div className="mt-6 border border-line bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ink-muted">{t('submit.code')}</p>
            <p className="ltr-iso text-xl font-bold text-orange">{sub.code}</p>
            <p className="mt-2 text-lg font-bold text-navy" dir="auto">
              {sub.title}
            </p>
            <p className="text-sm text-ink-muted">
              {typeLabel} · {formatDate(sub.createdAt, lang)}
            </p>
          </div>
          <div className="text-end">
            <p className="text-sm text-ink-muted">{t('track.status')}</p>
            <span className={`mt-1 inline-block rounded-full px-4 py-1.5 font-semibold ${TONE[sub.status]}`}>{t(`status.${sub.status}` as DictKey)}</span>
          </div>
        </div>

        {sub.messageToSubmitter && (
          <div className="mt-6 rounded bg-mint-25 p-4">
            <p className="font-semibold text-navy">{t('track.message')}</p>
            <p className="mt-1 whitespace-pre-line text-navy/90">{sub.messageToSubmitter}</p>
          </div>
        )}

        <section aria-labelledby="hist" className="mt-8">
          <h2 id="hist" className="text-lg font-bold text-navy">
            {t('track.history')}
          </h2>
          <ol className="mt-3 space-y-3 border-s-2 border-line ps-5">
            {sub.history.map((h) => (
              <li key={h.id} className="relative">
                <span aria-hidden className="absolute -start-[1.6rem] top-1.5 size-3 rounded-full bg-orange" />
                <p className="font-semibold text-navy">{t(`status.${h.toStatus}` as DictKey)}</p>
                <p className="text-sm text-ink-muted">
                  {formatDate(h.createdAt, lang)} · {h.actor === 'submitter' ? tx('منك', 'by you') : tx('فريق ألفين', 'Alfeen team')}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="revs" className="mt-8">
          <h2 id="revs" className="text-lg font-bold text-navy">
            {t('track.revisions')}
          </h2>
          <ul className="mt-3 space-y-3">
            {sub.revisions.map((r) => (
              <li key={r.id} className="rounded border border-line p-4">
                <p className="font-semibold text-navy">
                  {tx('النسخة', 'Version')} <span className="ltr-iso">{r.number}</span> <span className="text-sm font-normal text-ink-muted">· {formatDate(r.createdAt, lang)}</span>
                </p>
                {r.note && <p className="mt-1 text-sm text-ink-muted">{r.note}</p>}
                <ul className="mt-2 space-y-1 text-sm">
                  {r.files.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 text-navy">
                      <FileText aria-hidden size={15} /> <span dir="auto">{f.originalName}</span> <span className="ltr-iso text-ink-soft">({(f.size / 1048576).toFixed(1)} MB)</span>
                    </li>
                  ))}
                  {r.privateLink && (
                    <li className="flex items-center gap-2 text-navy">
                      <Link2 aria-hidden size={15} /> {tx('رابط خاص مرفق', 'Private link attached')}
                    </li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        {sub.status === 'NEEDS_CHANGES' && (
          <section aria-labelledby="send-rev" className="mt-8 border-t border-line pt-6">
            <h2 id="send-rev" className="text-lg font-bold text-navy">
              {t('track.sendRevision')}
            </h2>
            <div className="mt-4">
              <RevisionForm token={token} lang={lang} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
