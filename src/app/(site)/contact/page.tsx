import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { getSettings } from '@/lib/queries/settings';
import { PageIntro } from '@/components/site/PageIntro';
import { ContactForm } from '@/components/site/ContactForm';
import { SocialIcon } from '@/components/site/SocialIcon';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('contact.title'), description: t('contact.lead') };
}

export default async function ContactPage() {
  const { t, lang } = await getT();
  const settings = await getSettings();
  const social = (settings.socialLinks as Array<{ platform: string; url: string; label?: string }>) ?? [];
  return (
    <>
      <PageIntro crumbs={[{ label: t('contact.title') }]} title={t('contact.title')} lead={t('contact.lead')} />
      <section className="container-site grid gap-8 pt-8 pb-[var(--spacing-section)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ContactForm
          labels={{
            name: t('contact.name'), email: t('contact.email'), kind: t('contact.kind'), message: t('contact.message'), send: t('common.send'),
            general: t('contact.kind.general'), collab: t('contact.kind.collab'), media: t('contact.kind.media'), submission: t('contact.kind.submission'), other: t('contact.kind.other'),
          }}
        />
        <aside className="space-y-4">
          <div className="bg-mint-25 p-6">
            <p className="font-bold text-navy">{lang === 'ar' ? 'معلومات التواصل' : 'Contact details'}</p>
            {settings.publicContactEmail ? (
              <a href={`mailto:${settings.publicContactEmail}`} className="mt-3 inline-flex min-h-11 items-center gap-2 text-navy hover:text-orange">
                <Mail aria-hidden size={18} /> <span className="ltr-iso">{settings.publicContactEmail}</span>
              </a>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">{lang === 'ar' ? 'استخدم النموذج وسيصل طلبك مباشرة إلى فريق ألفين.' : 'Use the form and your message goes straight to the Alfeen team.'}</p>
            )}
            {social.length > 0 && (
              <ul className="mt-4 flex gap-2">
                {social.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label ?? s.platform} className="inline-flex size-11 items-center justify-center rounded-full bg-white text-navy hover:text-orange">
                      <SocialIcon platform={s.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-pink-50 p-6">
            <p className="font-bold text-navy">{t('nav.submit')}</p>
            <p className="mt-1 text-sm text-ink-muted">{lang === 'ar' ? 'لإرسال عمل للنشر استخدم نموذج المشاركة لتحصل على رقم طلب ورابط متابعة.' : 'To send work for publication, use the submission form to get a reference and tracking link.'}</p>
            <Link href="/submit" className="link-arrow mt-2">
              {t('submit.title')} {t('submit.titleHighlight')}
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}
