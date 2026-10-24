import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { getLang } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/dict';
import './globals.css';

// بديل مؤقت لخط Thmanyah المحدد في دليل الهوية حتى توفر ملفاته المرخّصة.
// ثلاثة أوزان فقط (500 كان يضيف ملفين لفرق بصري طفيف؛ font-medium يظهر بالوزن العادي).
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: { default: translate(lang, 'brand.logo'), template: `%s | ${translate(lang, 'brand.name')}` },
    description: translate(lang, 'brand.description'),
    metadataBase: new URL(process.env.APP_URL || 'http://localhost:3030'),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className={arabic.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
