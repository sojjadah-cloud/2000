import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/server';
import { PageIntro } from '@/components/site/PageIntro';
import { SubmitForm } from '@/components/site/SubmitForm';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t('submit.title')} ${t('submit.titleHighlight')}`, description: t('submit.lead') };
}

export default async function SubmitPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { t, lang } = await getT();
  const sp = await searchParams;
  return (
    <>
      <PageIntro crumbs={[{ label: t('nav.submit') }]} title={t('submit.title')} highlight={t('submit.titleHighlight')} lead={t('submit.lead')} />
      <section className="container-site max-w-4xl pt-8 pb-[var(--spacing-section)]">
        <SubmitForm
          lang={lang}
          initialType={sp.type}
          labels={{ steps: [t('submit.step1'), t('submit.step2'), t('submit.step3'), t('submit.step4'), t('submit.step5')], next: t('common.next'), prev: t('common.prev'), send: t('common.send') }}
        />
      </section>
    </>
  );
}
