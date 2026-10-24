import { AlertTriangle } from 'lucide-react';
import { PageIntro } from './PageIntro';

/** صفحة نصية قانونية بتنبيه واضح أنها مسودة أولية غير معتمدة. */
export function LegalPage({ title, crumb, lang, sections }: { title: string; crumb: string; lang: 'ar' | 'en'; sections: Array<{ h: string; p: string[] }> }) {
  return (
    <>
      <PageIntro crumbs={[{ label: crumb }]} title={title} coil={false} />
      <div className="container-site max-w-[52rem] pt-6 pb-[var(--spacing-section)]">
        <p role="note" className="flex items-start gap-3 rounded bg-yellow-50 p-4 text-[0.95rem] text-navy">
          <AlertTriangle aria-hidden size={20} className="mt-0.5 shrink-0 text-orange" />
          {lang === 'ar'
            ? 'مسودة أولية تصف طريقة عمل المنصة تقنيًا، ولم تُعتمد قانونيًا بعد. تحتاج إلى مراجعة واعتماد إدارة المجلة قبل الإطلاق.'
            : 'Initial draft describing how the platform works technically. It has not been legally approved and needs review by the magazine before launch.'}
        </p>
        <div className="prose-alfeen mt-8 max-w-none">
          {sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
