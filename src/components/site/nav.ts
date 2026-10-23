import type { DictKey } from '@/lib/i18n/dict';

export const NAV_ITEMS: Array<{ href: string; key: DictKey }> = [
  { href: '/', key: 'nav.home' },
  { href: '/issues', key: 'nav.issues' },
  { href: '/works', key: 'nav.works' },
  { href: '/articles', key: 'nav.articles' },
  { href: '/events', key: 'nav.events' },
  { href: '/creators', key: 'nav.creators' },
  { href: '/about', key: 'nav.about' },
];

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
}
