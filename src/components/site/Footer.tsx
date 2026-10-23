import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { getT } from '@/lib/i18n/server';
import { getSettings } from '@/lib/queries/settings';
import { SocialIcon } from './SocialIcon';

export async function Footer() {
  const { t, lang } = await getT();
  const settings = await getSettings();
  const social = (settings.socialLinks as Array<{ platform: string; url: string; label?: string }>) ?? [];
  const tagline = lang === 'en' && settings.footerTaglineEn ? settings.footerTaglineEn : settings.footerTagline;

  return (
    <footer className="border-t border-line bg-white">
      <div className="container-site flex flex-col items-center gap-4 py-6 text-center sm:flex-row sm:justify-between sm:gap-6 sm:text-start">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Logo width={68} label={t('brand.logo')} />
          <div className="text-[0.8rem] leading-6 text-navy">
            <p>{tagline}</p>
            <p>
              {t('footer.rights')} <span className="ltr-iso">© {settings.copyrightYear}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[0.85rem] text-navy">
          <nav aria-label={t('footer.contact')} className="flex items-center gap-4">
            <Link href="/contact" className="inline-flex min-h-11 items-center hover:text-orange">
              {t('footer.contact')}
            </Link>
            <span aria-hidden className="h-4 w-px bg-navy/40" />
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-orange">
              {t('footer.privacy')}
            </Link>
          </nav>
          {social.length > 0 && (
            <>
              <span aria-hidden className="mx-2 h-5 w-px bg-navy/30" />
              <ul className="flex items-center gap-3">
                {social.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label ?? s.platform} className="inline-flex size-10 items-center justify-center text-navy hover:text-orange">
                      <SocialIcon platform={s.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
