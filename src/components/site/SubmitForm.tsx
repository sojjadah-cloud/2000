'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, Copy, FileText, Trash2, Upload } from 'lucide-react';
import { ACCEPT_ATTR, SUBMISSION_LIMITS, SUBMISSION_TYPES } from '@/lib/submissions';

type Lang = 'ar' | 'en';
type Result = { code: string; trackUrl: string | null; emailed: boolean };

const MB = 1024 * 1024;

/** علامة الحقل الإلزامي (التسمية النصية للحقل كافية لقارئ الشاشة مع required). */
function Req() {
  return (
    <span className="text-orange" aria-hidden>
      *
    </span>
  );
}

export function SubmitForm({ lang, initialType, labels }: { lang: Lang; initialType?: string; labels: { steps: string[]; next: string; prev: string; send: string } }) {
  const tx = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({ type: SUBMISSION_TYPES.some((t) => t.value === initialType) ? initialType! : '' , language: 'ar' });
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [touchedStep, setTouchedStep] = useState(false);

  useEffect(() => {
    if (touchedStep) headingRef.current?.focus();
  }, [step, touchedStep]);

  const set = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const el = e.target as HTMLInputElement;
    set(el.name, el.type === 'checkbox' ? (el.checked ? 'on' : '') : el.value);
    if (errors[el.name]) setErrors((s) => ({ ...s, [el.name]: '' }));
  };

  const required = tx('هذا الحقل مطلوب.', 'This field is required.');
  const validate = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    const v = values;
    if (s === 0 && !v.type) e.type = tx('اختر نوع المشاركة.', 'Choose a submission type.');
    if (s === 1) {
      if (!v.name || v.name.trim().length < 2) e.name = required;
      if (!v.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = tx('أدخل بريدًا إلكترونيًا صحيحًا.', 'Enter a valid email.');
      if (v.isMinor) {
        if (!v.guardianName) e.guardianName = required;
        if (!v.guardianEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.guardianEmail)) e.guardianEmail = tx('أدخل بريد ولي الأمر.', "Enter the guardian's email.");
      }
    }
    if (s === 2) {
      if (!v.title || v.title.trim().length < 2) e.title = required;
      if (!v.description || v.description.trim().length < 20) e.description = tx('اكتب وصفًا من 20 حرفًا على الأقل.', 'Write at least 20 characters.');
      if (v.previouslyPublished && !v.publishedWhere) e.publishedWhere = tx('اذكر أين نُشر العمل.', 'Say where it was published.');
    }
    if (s === 3) {
      if (files.length === 0 && !v.privateLink) e.files = tx('أرفق ملفًا واحدًا على الأقل أو ضع رابطًا خاصًا.', 'Attach at least one file or add a private link.');
      if (v.privateLink && !/^https?:\/\/\S+$/.test(v.privateLink)) e.privateLink = tx('أدخل رابطًا يبدأ بـ https://', 'Enter a link starting with https://');
      if (files.length > SUBMISSION_LIMITS.maxFiles) e.files = tx(`الحد الأقصى ${SUBMISSION_LIMITS.maxFiles} ملفات.`, `Maximum ${SUBMISSION_LIMITS.maxFiles} files.`);
      if (files.reduce((a, f) => a + f.size, 0) > SUBMISSION_LIMITS.maxTotalMB * MB) e.files = tx(`مجموع الملفات أكبر من ${SUBMISSION_LIMITS.maxTotalMB} م.ب.`, `Files exceed ${SUBMISSION_LIMITS.maxTotalMB} MB in total.`);
    }
    if (s === 4) {
      if (!v.rightsStatement || v.rightsStatement.trim().length < 10) e.rightsStatement = tx('وضّح حقوق العمل (10 أحرف على الأقل).', 'Describe the rights (at least 10 characters).');
      if (!v.termsAccepted) e.termsAccepted = tx('يجب الموافقة على الشروط للإرسال.', 'You must accept the terms.');
      if (v.isMinor && !v.guardianConsent) e.guardianConsent = tx('موافقة ولي الأمر مطلوبة.', 'Guardian consent is required.');
    }
    return e;
  };

  const goNext = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) {
      formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(e)[0]}"]`)?.focus();
      return;
    }
    setTouchedStep(true);
    setStep((s) => Math.min(4, s + 1));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (step < 4) return goNext();
    const all = [0, 1, 2, 3, 4].reduce((acc, s) => ({ ...acc, ...validate(s) }), {} as Record<string, string>);
    setErrors(all);
    if (Object.keys(all).length) return;
    setStatus('sending');
    setServerError('');
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => v && fd.append(k, v));
    files.forEach((f) => fd.append('files', f));
    try {
      const res = await fetch('/api/submissions', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setResult({ code: data.code, trackUrl: data.trackUrl, emailed: data.emailed });
        setStatus('idle');
        window.scrollTo({ top: 0 });
        return;
      }
      setStatus('error');
      setServerError(
        data.error === 'rate' ? tx('أرسلت مشاركات كثيرة خلال وقت قصير. حاول بعد ساعة.', 'Too many submissions. Try again in an hour.')
        : data.error === 'file' ? tx(`ملف غير مقبول: ${data.detail ?? ''}`, `File not accepted: ${data.detail ?? ''}`)
        : data.error === 'tooLarge' || data.error === 'tooManyFiles' ? tx('الملفات تتجاوز الحد المسموح.', 'Files exceed the allowed limit.')
        : data.error === 'validation' ? tx(`راجع الحقول: ${(data.fields ?? []).join('، ')}`, `Check these fields: ${(data.fields ?? []).join(', ')}`)
        : tx('تعذّر حفظ المشاركة. لم يُرسل شيء؛ حاول مرة أخرى.', 'Could not save the submission. Nothing was sent; please try again.'),
      );
    } catch {
      setStatus('error');
      setServerError(tx('انقطع الاتصال قبل اكتمال الإرسال. لم تُحفظ المشاركة؛ حاول مرة أخرى.', 'Connection lost before sending completed. Nothing was saved; please try again.'));
    }
  };

  // ───── شاشة التأكيد: تظهر فقط بعد حفظ حقيقي على الخادم ─────
  if (result) {
    return (
      <div role="status" className="border border-line bg-white p-6 text-center sm:p-10">
        <CheckCircle2 aria-hidden size={54} className="mx-auto text-[#1f8f5f]" />
        <h2 className="mt-4 text-h2 font-bold text-navy">{tx('تم استلام مشاركتك', 'Submission received')}</h2>
        <p className="mt-3 text-ink-muted">{tx('رقم الطلب', 'Reference')}</p>
        <p className="ltr-iso text-[1.8rem] font-bold tracking-wider text-orange">{result.code}</p>
        {result.trackUrl && (
          <div className="mx-auto mt-6 max-w-xl rounded bg-mint-25 p-5 text-start">
            <p className="font-bold text-navy">{tx('رابط المتابعة الخاص', 'Private tracking link')}</p>
            <p className="mt-1 text-sm text-ink-muted">{tx('احتفظ بهذا الرابط؛ هو طريقتك لمتابعة طلبك دون حساب. لا تشاركه.', 'Keep this link — it is how you follow your submission without an account. Do not share it.')}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input readOnly value={result.trackUrl} dir="ltr" aria-label={tx('رابط المتابعة', 'Tracking link')} className="field text-start text-sm" onFocus={(e) => e.target.select()} />
              <button
                type="button"
                className="btn btn-outline shrink-0"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(result.trackUrl!);
                    setCopied(true);
                  } catch {
                    /* لا وصول للحافظة */
                  }
                }}
              >
                {copied ? <Check aria-hidden size={17} /> : <Copy aria-hidden size={17} />} {copied ? tx('تم النسخ', 'Copied') : tx('نسخ', 'Copy')}
              </button>
            </div>
            <p className={`mt-3 text-sm ${result.emailed ? 'text-[#1f8f5f]' : 'text-burgundy'}`}>
              {result.emailed ? tx('أرسلنا الرابط إلى بريدك أيضًا.', 'We also emailed you the link.') : tx('خدمة البريد غير مهيأة حاليًا، لذا لم يُرسل الرابط إلى بريدك. انسخه الآن.', 'Email delivery is not configured, so the link was not emailed. Copy it now.')}
            </p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {result.trackUrl && (
            <a href={result.trackUrl} className="btn btn-primary">
              {tx('متابعة الطلب', 'Track submission')}
            </a>
          )}
          <Link href="/" className="btn btn-outline">
            {tx('العودة إلى الرئيسية', 'Back to home')}
          </Link>
        </div>
      </div>
    );
  }

  const err = (name: string) =>
    errors[name] ? (
      <p id={`err-${name}`} className="field-error">
        {errors[name]}
      </p>
    ) : null;
  const aria = (name: string) => ({ 'aria-invalid': !!errors[name] || undefined, 'aria-describedby': errors[name] ? `err-${name}` : undefined });

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="border border-line bg-white">
      {/* مؤشر الخطوات */}
      <ol className="grid grid-cols-5 border-b border-line">
        {labels.steps.map((s, i) => (
          <li key={s} className={`flex flex-col items-center gap-1.5 px-1 py-3 text-center text-[0.72rem] sm:flex-row sm:justify-center sm:gap-2 sm:text-[0.85rem] ${i === step ? 'text-navy' : 'text-ink-soft'}`} aria-current={i === step ? 'step' : undefined}>
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[0.8rem] font-bold ${i < step ? 'bg-[#1f8f5f] text-white' : i === step ? 'bg-orange text-white' : 'bg-chip text-navy'}`}>
              {i < step ? <Check aria-hidden size={15} /> : <span className="ltr-iso">{i + 1}</span>}
            </span>
            <span className={`${i === step ? 'font-bold' : ''} hidden min-[420px]:inline`}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="p-5 sm:p-8">
        <h2 ref={headingRef} tabIndex={-1} className="text-[1.4rem] font-bold text-navy outline-none">
          <span className="sr-only">
            {tx('الخطوة', 'Step')} {step + 1} / 5:{' '}
          </span>
          {labels.steps[step]}
        </h2>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        {/* 1. نوع المشاركة */}
        <fieldset hidden={step !== 0} className="mt-5">
          <legend className="sr-only">{labels.steps[0]}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {SUBMISSION_TYPES.map((t) => (
              <label key={t.value} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded border px-4 py-3 ${values.type === t.value ? 'border-orange bg-orange/5' : 'border-line hover:border-navy/40'}`}>
                <input type="radio" name="type" value={t.value} checked={values.type === t.value} onChange={onChange} className="size-5 accent-orange" {...aria('type')} />
                <span className="font-semibold text-navy">{lang === 'en' ? t.en : t.ar}</span>
              </label>
            ))}
          </div>
          {err('type')}
        </fieldset>

        {/* 2. معلومات المشارك */}
        <fieldset hidden={step !== 1} className="mt-5 space-y-5">
          <legend className="sr-only">{labels.steps[1]}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="s-name" className="field-label">
                {tx('الاسم', 'Name')} <Req />
              </label>
              <input id="s-name" name="name" value={values.name ?? ''} onChange={onChange} autoComplete="name" className="field" {...aria('name')} />
              {err('name')}
            </div>
            <div>
              <label htmlFor="s-email" className="field-label">
                {tx('البريد الإلكتروني', 'Email')} <Req />
              </label>
              <input id="s-email" name="email" type="email" inputMode="email" dir="ltr" value={values.email ?? ''} onChange={onChange} autoComplete="email" className="field text-start" {...aria('email')} />
              {err('email')}
              <p className="field-hint">{tx('يُستخدم للتواصل بشأن مشاركتك فقط ولا يُنشر.', 'Used only to contact you about this submission; never published.')}</p>
            </div>
          </div>
          <div>
            <label htmlFor="s-field" className="field-label">
              {tx('مجالك', 'Your field')} <span className="text-sm font-normal text-ink-soft">({tx('اختياري', 'optional')})</span>
            </label>
            <input id="s-field" name="field" value={values.field ?? ''} onChange={onChange} className="field" placeholder={tx('مثال: تصوير، رسم، كتابة', 'e.g. photography, illustration, writing')} />
          </div>
          <div>
            <label htmlFor="s-bio" className="field-label">
              {tx('نبذة عنك', 'Short bio')} <span className="text-sm font-normal text-ink-soft">({tx('اختياري', 'optional')})</span>
            </label>
            <textarea id="s-bio" name="bio" rows={3} maxLength={1500} value={values.bio ?? ''} onChange={onChange} className="field" />
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="isMinor" checked={!!values.isMinor} onChange={onChange} className="mt-1 size-5 accent-orange" />
            <span className="text-navy">{tx('عمري أقل من 18 عامًا', 'I am under 18')}</span>
          </label>
          {values.isMinor && (
            <div className="grid gap-5 rounded bg-yellow-50 p-4 sm:grid-cols-2">
              <p className="text-sm text-navy sm:col-span-2">{tx('نحتاج بيانات ولي الأمر وموافقته قبل مراجعة المشاركة.', "We need a parent or guardian's details and consent before reviewing.")}</p>
              <div>
                <label htmlFor="s-gname" className="field-label">
                  {tx('اسم ولي الأمر', 'Guardian name')} <Req />
                </label>
                <input id="s-gname" name="guardianName" value={values.guardianName ?? ''} onChange={onChange} className="field" {...aria('guardianName')} />
                {err('guardianName')}
              </div>
              <div>
                <label htmlFor="s-gemail" className="field-label">
                  {tx('بريد ولي الأمر', 'Guardian email')} <Req />
                </label>
                <input id="s-gemail" name="guardianEmail" type="email" inputMode="email" dir="ltr" value={values.guardianEmail ?? ''} onChange={onChange} className="field text-start" {...aria('guardianEmail')} />
                {err('guardianEmail')}
              </div>
            </div>
          )}
        </fieldset>

        {/* 3. تفاصيل العمل */}
        <fieldset hidden={step !== 2} className="mt-5 space-y-5">
          <legend className="sr-only">{labels.steps[2]}</legend>
          <div>
            <label htmlFor="s-title" className="field-label">
              {tx('عنوان العمل', 'Title')} <Req />
            </label>
            <input id="s-title" name="title" value={values.title ?? ''} onChange={onChange} maxLength={200} className="field" {...aria('title')} />
            {err('title')}
          </div>
          <div>
            <label htmlFor="s-desc" className="field-label">
              {tx('وصف العمل', 'Description')} <Req />
            </label>
            <textarea id="s-desc" name="description" rows={5} maxLength={5000} value={values.description ?? ''} onChange={onChange} className="field" {...aria('description')} />
            {err('description')}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="s-lang" className="field-label">
                {tx('لغة العمل', 'Language')}
              </label>
              <select id="s-lang" name="language" value={values.language} onChange={onChange} className="field">
                <option value="ar">{tx('العربية', 'Arabic')}</option>
                <option value="en">{tx('الإنجليزية', 'English')}</option>
                <option value="ar,en">{tx('العربية والإنجليزية', 'Arabic and English')}</option>
                <option value="other">{tx('أخرى / بلا نص', 'Other / no text')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="s-collab" className="field-label">
                {tx('المشاركون في العمل', 'Collaborators')} <span className="text-sm font-normal text-ink-soft">({tx('اختياري', 'optional')})</span>
              </label>
              <input id="s-collab" name="collaborators" value={values.collaborators ?? ''} onChange={onChange} className="field" placeholder={tx('الأسماء وأدوارهم', 'Names and roles')} />
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="previouslyPublished" checked={!!values.previouslyPublished} onChange={onChange} className="mt-1 size-5 accent-orange" />
            <span className="text-navy">{tx('سبق نشر هذا العمل', 'This work was published before')}</span>
          </label>
          {values.previouslyPublished && (
            <div>
              <label htmlFor="s-where" className="field-label">
                {tx('أين نُشر؟', 'Where?')} <Req />
              </label>
              <input id="s-where" name="publishedWhere" value={values.publishedWhere ?? ''} onChange={onChange} className="field" {...aria('publishedWhere')} />
              {err('publishedWhere')}
            </div>
          )}
        </fieldset>

        {/* 4. الملفات */}
        <fieldset hidden={step !== 3} className="mt-5 space-y-5">
          <legend className="sr-only">{labels.steps[3]}</legend>
          <div className="rounded bg-mint-25 p-4 text-sm text-navy">
            <p className="font-semibold">{tx('قبل الرفع:', 'Before uploading:')}</p>
            <ul className="mt-2 list-disc space-y-1 ps-5">
              {SUBMISSION_LIMITS.groups.map((g) => (
                <li key={g.key}>
                  {lang === 'en' ? g.en : g.ar} — {tx('حتى', 'up to')} <span className="ltr-iso">{g.maxMB} MB</span>
                </li>
              ))}
              <li>
                {tx('بحد أقصى', 'At most')} <span className="ltr-iso">{SUBMISSION_LIMITS.maxFiles}</span> {tx('ملفات، ومجموعها', 'files,')} <span className="ltr-iso">{SUBMISSION_LIMITS.maxTotalMB} MB</span> {tx('', 'in total')}
              </li>
            </ul>
          </div>
          <div>
            <label
              htmlFor="s-files"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = Array.from(e.dataTransfer.files ?? []);
                setFiles((prev) => [...prev, ...dropped].slice(0, SUBMISSION_LIMITS.maxFiles + 1));
                setErrors((s) => ({ ...s, files: '' }));
              }}
              className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-navy/25 bg-[#faf9f9] p-5 text-center hover:border-orange"
            >
              <Upload aria-hidden size={26} className="text-orange" />
              <span className="font-semibold text-navy">{tx('اختر الملفات', 'Choose files')}</span>
              <span className="text-sm text-ink-soft">{tx('أو اسحبها إلى هنا', 'or drag them here')}</span>
            </label>
            <input
              id="s-files"
              name="files"
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              className="sr-only"
              {...aria('files')}
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                setFiles((prev) => [...prev, ...picked].slice(0, SUBMISSION_LIMITS.maxFiles + 1));
                setErrors((s) => ({ ...s, files: '' }));
                e.target.value = '';
              }}
            />
            {files.length > 0 && (
              <ul className="mt-3 divide-y divide-line rounded border border-line">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2">
                    <FileText aria-hidden size={18} className="shrink-0 text-navy" />
                    <span className="min-w-0 flex-1 truncate text-sm" dir="auto">
                      {f.name}
                    </span>
                    <span className="ltr-iso text-xs text-ink-soft">{(f.size / MB).toFixed(1)} MB</span>
                    <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} aria-label={`${tx('إزالة', 'Remove')} ${f.name}`} className="inline-flex size-10 items-center justify-center text-burgundy hover:bg-pink-50">
                      <Trash2 aria-hidden size={17} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {err('files')}
          </div>
          <div>
            <label htmlFor="s-link" className="field-label">
              {tx('رابط خاص (اختياري)', 'Private link (optional)')}
            </label>
            <input id="s-link" name="privateLink" type="url" inputMode="url" dir="ltr" placeholder="https://" value={values.privateLink ?? ''} onChange={onChange} className="field text-start" {...aria('privateLink')} />
            {err('privateLink')}
            <p className="field-hint">{tx('للملفات الكبيرة: رابط Google Drive أو Vimeo خاص بصلاحية العرض.', 'For large files: a private Google Drive or Vimeo link with view access.')}</p>
          </div>
        </fieldset>

        {/* 5. الموافقات والمراجعة */}
        <fieldset hidden={step !== 4} className="mt-5 space-y-5">
          <legend className="sr-only">{labels.steps[4]}</legend>
          <dl className="divide-y divide-line rounded border border-line text-sm">
            {[
              [tx('النوع', 'Type'), SUBMISSION_TYPES.find((t) => t.value === values.type)?.[lang] ?? ''],
              [tx('الاسم', 'Name'), values.name],
              [tx('البريد', 'Email'), values.email],
              [tx('العنوان', 'Title'), values.title],
              [tx('الملفات', 'Files'), files.length ? files.map((f) => f.name).join('، ') : values.privateLink || '—'],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 px-4 py-2.5">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="break-words text-navy" dir="auto">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <div>
            <label htmlFor="s-rights" className="field-label">
              {tx('حقوق العمل', 'Rights')} <Req />
            </label>
            <textarea
              id="s-rights"
              name="rightsStatement"
              rows={3}
              value={values.rightsStatement ?? ''}
              onChange={onChange}
              className="field"
              placeholder={tx('مثال: العمل من إنتاجي بالكامل، والصور التقطتها بنفسي، ولي حق نشره.', 'e.g. This is entirely my own work and I have the right to publish it.')}
              {...aria('rightsStatement')}
            />
            {err('rightsStatement')}
          </div>
          {values.isMinor && (
            <label className="flex cursor-pointer items-start gap-3 rounded bg-yellow-50 p-3">
              <input type="checkbox" name="guardianConsent" checked={!!values.guardianConsent} onChange={onChange} className="mt-1 size-5 accent-orange" {...aria('guardianConsent')} />
              <span className="text-navy">{tx('يوافق ولي الأمر على إرسال هذه المشاركة ونشرها في حال قبولها.', 'My parent/guardian consents to this submission and its publication if accepted.')}</span>
            </label>
          )}
          {err('guardianConsent')}
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="termsAccepted" checked={!!values.termsAccepted} onChange={onChange} className="mt-1 size-5 accent-orange" {...aria('termsAccepted')} />
            <span className="text-navy">
              {tx('قرأت ', 'I have read and accept the ')}
              <Link href="/terms" target="_blank" className="font-semibold text-orange-600 underline">
                {tx('شروط المشاركة والنشر', 'participation and publishing terms')}
              </Link>
              {tx(' وأوافق عليها.', '.')}
            </span>
          </label>
          {err('termsAccepted')}
          {status === 'error' && (
            <p role="alert" className="rounded bg-pink-50 px-4 py-3 text-sm text-burgundy">
              {serverError}
            </p>
          )}
        </fieldset>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          {step > 0 ? (
            <button type="button" onClick={() => { setTouchedStep(true); setStep((s) => s - 1); }} className="btn btn-outline">
              {labels.prev}
            </button>
          ) : (
            <span />
          )}
          {step < 4 ? (
            <button type="button" onClick={goNext} className="btn btn-primary min-w-[9rem]">
              {labels.next}
            </button>
          ) : (
            <button type="submit" disabled={status === 'sending'} className="btn btn-primary min-w-[9rem]">
              {status === 'sending' ? tx('جارٍ الإرسال…', 'Sending…') : labels.send}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
