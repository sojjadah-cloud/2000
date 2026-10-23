'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, isActive } from './nav';

export function NavLinks({ labels }: { labels: Record<string, string> }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-[clamp(1rem,2.4vw,2.4rem)]">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`relative block py-2 text-[0.95rem] font-medium whitespace-nowrap transition-colors hover:text-orange ${
                active ? 'text-navy after:absolute after:inset-x-0 after:-bottom-1 after:h-[3px] after:rounded-full after:bg-orange' : 'text-navy/85'
              }`}
            >
              {labels[item.key]}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
