'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ACCEPT_ATTR, SUBMISSION_LIMITS } from '@/lib/submissions';

export function RevisionForm({ token, lang }: { token: string; lang: 'ar' | 'en' }) {
  const tx = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState('sending');
        const fd = new FormData(e.currentTarget);
        fd.set('token', token);
        try {
          const res = await fetch('/api/submissions/revision', { method: 'POST', body: fd });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.ok) {
            setState('done');
            setMessage(tx('أُرسلت النسخة المعدّلة وعادت المشاركة إلى المراجعة.', 'Revision sent; your submission is back in review.'));
            router.refresh();
          } else {
            setState('error');
            setMessage(
              data.error === 'empty' ? tx('أضف ملاحظة أو ملفًا أو رابطًا.', 'Add a note, a file or a link.')
              : data.error === 'state' ? tx('لا يمكن إرسال نسخة معدّلة في الحالة الحالية.', 'A revision cannot be sent in the current status.')
              : data.error === 'file' ? tx(`ملف غير مقبول: ${data.detail ?? ''}`, `File not accepted: ${data.detail ?? ''}`)
              : tx('تعذّر الإرسال، لم يُحفظ شيء. حاول مجددًا.', 'Could not send; nothing was saved. Try again.'),
            );
          }
        } catch {
          setState('error');
          setMessage(tx('انقطع الاتصال، لم يُحفظ شيء.', 'Connection lost; nothing was saved.'));
        }
      }}
    >
      <div>
        <label htmlFor="r-note" className="field-label">
          {tx('ملاحظة للفريق', 'Note for the team')}
        </label>
        <textarea id="r-note" name="note" rows={3} maxLength={3000} className="field" />
      </div>
      <div>
        <label htmlFor="r-files" className="field-label">
          {tx('الملفات المعدّلة', 'Revised files')}
        </label>
        <input id="r-files" name="files" type="file" multiple accept={ACCEPT_ATTR} className="field py-2" />
        <p className="field-hint">
          {tx('حتى', 'Up to')} <span className="ltr-iso">{SUBMISSION_LIMITS.maxFiles}</span> {tx('ملفات، بمجموع', 'files,')} <span className="ltr-iso">{SUBMISSION_LIMITS.maxTotalMB} MB</span>
        </p>
      </div>
      <div>
        <label htmlFor="r-link" className="field-label">
          {tx('رابط خاص (اختياري)', 'Private link (optional)')}
        </label>
        <input id="r-link" name="privateLink" type="url" dir="ltr" placeholder="https://" className="field text-start" />
      </div>
      {message && (
        <p role={state === 'error' ? 'alert' : 'status'} className={`rounded px-4 py-3 text-sm ${state === 'error' ? 'bg-pink-50 text-burgundy' : 'bg-mint-25 text-navy'}`}>
          {message}
        </p>
      )}
      <button type="submit" disabled={state === 'sending' || state === 'done'} className="btn btn-primary">
        {state === 'sending' ? tx('جارٍ الإرسال…', 'Sending…') : tx('إرسال النسخة المعدّلة', 'Send revision')}
      </button>
    </form>
  );
}
