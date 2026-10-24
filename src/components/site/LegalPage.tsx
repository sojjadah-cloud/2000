import { PageIntro } from './PageIntro';

/** صفحة نصية (الخصوصية، الشروط). */
export function LegalPage({ title, crumb, lang, sections }: { title: string; crumb: string; lang: 'ar' | 'en'; sections: Array<{ h: string; p: string[] }> }) {
  return (
    <>
      <PageIntro crumbs={[{ label: crumb }]} title={title} coil={false} />
      <div className="container-site max-w-[52rem] pt-2 pb-[var(--spacing-section)]" lang={lang}>
        <div className="prose-alfeen max-w-none">
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
