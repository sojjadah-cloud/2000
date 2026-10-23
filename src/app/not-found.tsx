import Link from 'next/link';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { Coil } from '@/components/brand/Coil';
import { Arrow } from '@/components/site/Arrow';
import { getT } from '@/lib/i18n/server';

export default async function NotFound() {
  const { t } = await getT();
  return (
    <>
      <Header />
      <main id="main" className="relative overflow-hidden">
        <Coil loops={4} className="pointer-events-none absolute -start-10 top-10 h-48 w-80 opacity-80" />
        <div className="container-site relative flex min-h-[60vh] flex-col items-start justify-center py-20">
          <p className="eyebrow ltr-iso">404</p>
          <h1 className="mt-2 text-h1 font-bold text-navy">{t('error.notFound')}</h1>
          <p className="mt-3 text-lg text-ink-muted">{t('error.notFoundText')}</p>
          <Link href="/" className="btn btn-primary mt-8">
            {t('common.backHome')} <Arrow />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
