import { Coil } from '@/components/brand/Coil';
import { getT } from '@/lib/i18n/server';
import { NewsletterForm } from './NewsletterForm';

export async function NewsletterBand() {
  const { t, dir } = await getT();
  return (
    <section aria-labelledby="newsletter-title" className="relative overflow-hidden bg-navy text-white">
      <Coil
        loops={4}
        color="#5b6696"
        strokeWidth={2}
        className="pointer-events-none absolute -bottom-10 end-[-1%] h-36 w-72 opacity-80 rtl:-scale-x-100 sm:w-80"
      />
      <div className="container-site relative flex flex-col items-center gap-6 py-9 text-center lg:flex-row lg:items-center lg:justify-between lg:py-7 lg:text-start">
        <div>
          <h2 id="newsletter-title" className="text-[1.6rem] font-bold">
            {t('newsletter.title')}
          </h2>
          <p className="mt-1 text-[0.95rem] text-white/90">{t('newsletter.text')}</p>
        </div>
        <NewsletterForm
          dir={dir}
          labels={{ placeholder: t('newsletter.placeholder'), subscribe: t('newsletter.subscribe'), emailLabel: t('newsletter.emailLabel') }}
        />
      </div>
    </section>
  );
}
