import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { NewsletterBand } from '@/components/site/NewsletterBand';
import { getT } from '@/lib/i18n/server';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[60] focus:bg-white focus:px-4 focus:py-2">
        {t('nav.skip')}
      </a>
      <Header />
      <main id="main">{children}</main>
      <NewsletterBand />
      <Footer />
    </>
  );
}
