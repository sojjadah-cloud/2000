import Link from 'next/link';
import { headers } from 'next/headers';
import { Search } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { getT } from '@/lib/i18n/server';
import { setLanguage } from '@/lib/actions/public';
import { NavLinks } from './NavLinks';
import { MobileMenu } from './MobileMenu';
import { NAV_ITEMS } from './nav';

async function LangSwitch({ lang, label, short }: { lang: 'ar' | 'en'; label: string; short: string }) {
  const h = await headers();
  const back = h.get('x-pathname') || '/';
  return (
    <form action={setLanguage}>
      <input type="hidden" name="lang" value={lang === 'ar' ? 'en' : 'ar'} />
      <input type="hidden" name="back" value={back} />
      <button
        type="submit"
        aria-label={label}
        lang={lang === 'ar' ? 'en' : 'ar'}
        className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-[0.95rem] font-semibold text-navy hover:text-orange"
      >
        {short}
      </button>
    </form>
  );
}

export async function Header() {
  const { t, lang } = await getT();
  const labels: Record<string, string> = Object.fromEntries(NAV_ITEMS.map((i) => [i.key, t(i.key)]));
  labels['nav.menu'] = t('nav.menu');
  labels['nav.close'] = t('nav.close');
  labels['nav.main'] = t('nav.main');
  labels['nav.search'] = t('nav.search');
  labels['nav.submit'] = t('nav.submit');
  const langSwitch = <LangSwitch lang={lang} label={t('lang.switchLabel')} short={t('lang.switchShort')} />;

  return (
    // لا backdrop-filter هنا: يجعل الترويسة حاوية للعناصر الثابتة فتنقص قائمة الهاتف إلى ارتفاعها
    <header className="sticky top-0 z-50 border-b border-line bg-white [--header-h:4.75rem] lg:[--header-h:5.5rem]">
      <div className="container-site flex h-[var(--header-h)] items-center justify-between gap-6">
        <Link href="/" className="shrink-0" aria-label={t('nav.home')}>
          <span className="hidden lg:block">
            <Logo width={112} priority label={t('brand.logo')} />
          </span>
          <span className="lg:hidden">
            <Logo width={76} priority label={t('brand.logo')} />
          </span>
        </Link>

        <nav aria-label={t('nav.main')} className="hidden lg:block">
          <NavLinks labels={labels} />
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/search"
            aria-label={t('nav.search')}
            className="inline-flex size-11 items-center justify-center text-navy hover:text-orange"
          >
            <Search aria-hidden size={21} strokeWidth={2} />
          </Link>
          <span aria-hidden className="hidden h-5 w-px bg-navy/40 lg:block" />
          <div className="hidden lg:block">{langSwitch}</div>
          <Link href="/submit" className="btn btn-primary ms-3 hidden lg:inline-flex">
            {t('nav.submit')}
          </Link>
          <MobileMenu labels={labels} langForm={langSwitch} />
        </div>
      </div>
    </header>
  );
}
