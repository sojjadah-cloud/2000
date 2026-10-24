import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, ExternalLink } from 'lucide-react';
import { db } from '@/lib/db';
import { getT } from '@/lib/i18n/server';
import { getSettings } from '@/lib/queries/settings';
import { PageIntro } from '@/components/site/PageIntro';
import { SectionTitle } from '@/components/site/Blocks';
import { Media } from '@/components/site/Media';
import { Avatar } from '@/components/site/Cards';
import { Arrow } from '@/components/site/Arrow';
import { Logo } from '@/components/brand/Logo';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t('about.title')} ${t('about.titleHighlight')}` };
}

const isDraft = (s?: string | null) => !!s && s.startsWith('نص مبدئي');
const clean = (s: string) => s.replace(/^نص مبدئي:\s*/, '').replace(/\s*\(يُستبدل[^)]*\)\s*$/, '');

export default async function AboutPage() {
  const { t, lang } = await getT();
  const settings = await getSettings();
  // يظهر فقط ما اعتمده الفريق (visible) — لا أرقام أو جوائز أو شركاء مختلقون
  const [milestones, team, achievements, partners] = await Promise.all([
    db.milestone.findMany({ where: { visible: true }, orderBy: { sortOrder: 'asc' } }),
    db.teamMember.findMany({ where: { visible: true }, orderBy: { sortOrder: 'asc' }, include: { photo: true } }),
    db.achievement.findMany({ where: { visible: true }, orderBy: { sortOrder: 'asc' } }),
    db.partner.findMany({ where: { visible: true }, orderBy: { sortOrder: 'asc' }, include: { logo: true } }),
  ]);
  const anyDraft = [settings.aboutStory, settings.aboutVision, settings.aboutMission].some(isDraft);
  const blocks = [
    { id: 'story', title: t('about.story'), text: settings.aboutStory },
    { id: 'vision', title: t('about.vision'), text: settings.aboutVision },
    { id: 'mission', title: t('about.mission'), text: settings.aboutMission },
  ].filter((b) => b.text);

  return (
    <>
      <PageIntro crumbs={[{ label: t('nav.about') }]} title={t('about.title')} highlight={t('about.titleHighlight')} lead={lang === 'ar' ? 'مجلة شبابية عُمانية للإبداع والفنون والكتابة والثقافة.' : 'An Omani youth magazine for creativity, arts, writing and culture.'} />

      {blocks.length > 0 && (
        <section className="container-site mt-8" aria-label={t('about.story')}>
          {anyDraft && (
            <p role="note" className="mb-5 inline-block rounded bg-yellow-50 px-4 py-2 text-sm text-navy">
              {t('common.draftNotice')}
            </p>
          )}
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="flex items-center justify-center bg-navy p-10 md:order-last">
              <Logo variant="white" width={180} label={t('brand.logo')} />
            </div>
            <div className="space-y-6">
              {blocks.map((b) => (
                <div key={b.id} className="border-s-4 border-orange bg-white ps-5">
                  <h2 className="text-[1.4rem] font-bold text-navy">{b.title}</h2>
                  <p className="mt-2 max-w-[var(--container-read)] text-[1.05rem] leading-[1.95] text-navy/90" lang="ar">
                    {clean(b.text!)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.aboutFields.length > 0 && (
        <section aria-labelledby="fields" className="container-site section">
          <SectionTitle id="fields">{t('about.fields')}</SectionTitle>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(lang === 'en' && settings.tickerWordsEn.length === settings.aboutFields.length ? settings.tickerWordsEn : settings.aboutFields).map((f) => (
              <li key={f} className="flex min-h-24 items-center justify-center bg-mint-25 px-4 text-center text-[1.15rem] font-bold text-navy">
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {milestones.length > 0 && (
        <section aria-labelledby="timeline" className="container-site pb-[var(--spacing-section)]">
          <SectionTitle id="timeline">{t('about.timeline')}</SectionTitle>
          <ol className="mt-6 space-y-6 border-s-2 border-orange/40 ps-6">
            {milestones.map((m) => (
              <li key={m.id} className="relative">
                <span aria-hidden className="absolute -start-[1.95rem] top-1.5 size-3.5 rounded-full border-2 border-white bg-orange" />
                <p className="ltr-iso font-bold text-orange">{m.label}</p>
                <p className="text-lg font-bold text-navy">{m.title}</p>
                {m.description && <p className="text-ink-muted">{m.description}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {team.length > 0 && (
        <section aria-labelledby="team" className="container-site pb-[var(--spacing-section)]">
          <SectionTitle id="team">{t('about.team')}</SectionTitle>
          <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {team.map((m) => {
              const name = lang === 'en' && m.nameEn ? m.nameEn : m.name;
              return (
                <li key={m.id} className="border border-line bg-white p-5 text-center">
                  <div className="relative mx-auto size-24 overflow-hidden rounded-full">
                    {m.photo ? <Media asset={m.photo} lang={lang} fill sizes="96px" className="object-cover" /> : <Avatar name={name} className="size-full text-[0.9rem]" />}
                  </div>
                  <p className="mt-3 font-bold text-navy">{name}</p>
                  <p className="text-sm text-ink-muted">{lang === 'en' && m.roleEn ? m.roleEn : m.role}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {achievements.length > 0 && (
        <section aria-labelledby="achievements" className="container-site pb-[var(--spacing-section)]">
          <SectionTitle id="achievements">{t('about.achievements')}</SectionTitle>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {achievements.map((a) => (
              <li key={a.id} className="flex gap-3 border border-line bg-white p-5">
                <Award aria-hidden className="mt-1 shrink-0 text-orange" />
                <div>
                  <p className="font-bold text-navy">{a.title}</p>
                  {a.description && <p className="text-ink-muted">{a.description}</p>}
                  {a.sourceUrl && (
                    <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-orange-600 underline">
                      {lang === 'ar' ? 'المصدر' : 'Source'} <ExternalLink aria-hidden size={13} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {partners.length > 0 && (
        <section aria-labelledby="partners" className="container-site pb-[var(--spacing-section)]">
          <SectionTitle id="partners">{t('about.partners')}</SectionTitle>
          <ul className="mt-6 flex flex-wrap items-center gap-8">
            {partners.map((p) => (
              <li key={p.id}>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={p.name}>
                    {p.logo ? <Media asset={p.logo} lang={lang} sizes="160px" className="h-14 w-auto object-contain" /> : <span className="font-bold text-navy">{p.name}</span>}
                  </a>
                ) : p.logo ? (
                  <Media asset={p.logo} lang={lang} sizes="160px" className="h-14 w-auto object-contain" />
                ) : (
                  <span className="font-bold text-navy">{p.name}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="collab" className="bg-mint-25">
        <div className="container-site flex flex-col items-center gap-5 py-12 text-center md:flex-row md:justify-between md:text-start">
          <div>
            <h2 id="collab" className="text-[length:clamp(1.5rem,2.6vw,2rem)] font-bold text-navy">
              {t('about.collab')}
            </h2>
            <p className="mt-1 max-w-2xl text-navy/90">
              {settings.collaborationText ||
                (lang === 'ar' ? 'للشراكات والرعاية والتعاون التحريري، تواصل مع فريق ألفين.' : 'For partnerships, sponsorship and editorial collaboration, contact the Alfeen team.')}
            </p>
          </div>
          <Link href="/contact" className="btn btn-primary min-w-[11rem]">
            {t('about.contact')} <Arrow />
          </Link>
        </div>
      </section>
    </>
  );
}
