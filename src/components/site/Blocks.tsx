import Link from 'next/link';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Coil } from '@/components/brand/Coil';
import { sanitizeRich } from '@/lib/sanitize';
import { Arrow } from './Arrow';

/** زر «عرض المزيد»: رابط لصفحة أكبر من النتائج (يعمل مع التحديث والمشاركة). */
export function LoadMore({ href, label, shown, total }: { href: string; label: string; shown: number; total: number }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-2">
      <Link href={href} scroll={false} className="btn btn-outline min-w-[11rem]">
        {label} <ChevronDown aria-hidden size={18} />
      </Link>
      <p className="text-sm text-ink-soft" aria-live="polite">
        <span className="ltr-iso">
          {shown} / {total}
        </span>
      </p>
    </div>
  );
}

/** شريط الدعوة النعناعي (عندك عمل يستحق الظهور؟). */
export function CtaBand({ title, text, href, button }: { title: string; text: string; href: string; button: string }) {
  return (
    <section className="relative overflow-hidden bg-mint-25">
      <Coil loops={4} className="pointer-events-none absolute -bottom-6 end-[-2%] hidden h-36 w-72 md:block" />
      <div className="container-site relative flex flex-col items-center gap-5 py-10 text-center md:flex-row md:justify-between md:py-9 md:text-start">
        <div>
          <h2 className="text-[length:clamp(1.5rem,2.6vw,2rem)] font-bold text-navy">{title}</h2>
          <p className="mt-1 text-[1.05rem] text-navy/90">{text}</p>
        </div>
        <Link href={href} className="btn btn-primary min-w-[11rem] md:me-[12%]">
          {button} <Arrow />
        </Link>
      </div>
    </section>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line bg-white px-6 py-14 text-center">
      <Coil loops={3} className="h-14 w-36" />
      <p className="mt-4 text-lg font-bold text-navy">{title}</p>
      {text && <p className="mt-1 max-w-md text-ink-muted">{text}</p>}
      {action && (
        <Link href={action.href} className="btn btn-outline btn-sm mt-5">
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** وسم المحتوى التجريبي حتى لا يُقدَّم كحقيقة. */
export function DemoBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-navy">
      <Sparkles aria-hidden size={13} /> {label}
    </span>
  );
}

export function SectionTitle({ id, children, note, action }: { id?: string; children: React.ReactNode; note?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-start">
      <div>
        <h2 id={id} className="flex items-center gap-3 text-h2 font-bold text-navy">
          <span aria-hidden className="hidden h-8 w-1 rounded-full bg-orange sm:block" />
          {children}
        </h2>
        {note && <p className="mt-1 text-[0.95rem] text-ink-muted sm:ps-4">{note}</p>}
      </div>
      {action}
    </div>
  );
}

/** نص منسق من المحرر (معقّم عند الحفظ وعند العرض). */
export function RichText({ html, className = '', lang, poem = false }: { html: string; className?: string; lang?: string; poem?: boolean }) {
  return <div className={`prose-alfeen ${poem ? 'is-poem' : ''} ${className}`} lang={lang} dangerouslySetInnerHTML={{ __html: sanitizeRich(html) }} />;
}
