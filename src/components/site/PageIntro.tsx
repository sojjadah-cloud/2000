import Link from 'next/link';
import { Coil } from '@/components/brand/Coil';
import { getT } from '@/lib/i18n/server';

/** مسار التنقل + العنوان الكبير + الوصف، كما في صفحتي الأعداد وإبداعات المرجعيتين. */
export async function PageIntro({
  crumbs,
  title,
  highlight,
  lead,
  coil = true,
  children,
}: {
  crumbs: Array<{ label: string; href?: string }>;
  title: string;
  highlight?: string;
  lead?: string;
  coil?: boolean;
  children?: React.ReactNode;
}) {
  const { t } = await getT();
  return (
    <div className="relative overflow-x-clip">
      {coil && (
        <Coil loops={4} spread={6} radius={28} className="pointer-events-none absolute -top-6 end-[-3%] hidden h-40 w-72 -rotate-[8deg] md:block lg:h-48 lg:w-80" />
      )}
      <div className="container-site relative pt-6 pb-2 md:pt-8">
        <Breadcrumbs crumbs={[{ label: t('nav.home'), href: '/' }, ...crumbs]} label={t('nav.breadcrumb')} />
        <h1 className="mt-4 text-h1 font-bold text-navy">
          {title} {highlight && <span className="text-orange">{highlight}</span>}
        </h1>
        {lead && <p className="mt-3 max-w-2xl text-[length:clamp(1.05rem,1.6vw,1.3rem)] leading-[1.8] text-navy/90">{lead}</p>}
        {children}
      </div>
    </div>
  );
}

export function Breadcrumbs({ crumbs, label }: { crumbs: Array<{ label: string; href?: string }>; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-2 text-[0.9rem]">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {c.href && !last ? (
                <Link href={c.href} className="font-medium text-navy hover:text-orange">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'text-orange' : 'text-navy'}>
                  {c.label}
                </span>
              )}
              {!last && (
                <span aria-hidden className="text-navy/50">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
