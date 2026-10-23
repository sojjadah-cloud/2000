'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { NAV_ITEMS, isActive } from './nav';

// قائمة الهاتف: لوحة ثابتة تنسدل تحت الترويسة وتغطي الشاشة كاملة.
// ارتفاع البنود يتوزع على المساحة المتاحة (dvh) فتظهر كلها دون تمرير حتى على الشاشات القصيرة.

export function MobileMenu({
  labels,
  langForm,
}: {
  labels: Record<string, string>;
  langForm: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // إغلاق القائمة عند تغيير الصفحة
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('a,button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
      // حصر التركيز داخل القائمة وزر الإغلاق
      if (e.key === 'Tab' && panelRef.current && buttonRef.current) {
        const items = [buttonRef.current, ...panelRef.current.querySelectorAll<HTMLElement>('a,button')];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    // إغلاقها عند توسيع الشاشة إلى حجم سطح المكتب
    const mq = window.matchMedia('(min-width: 1024px)');
    const onWide = () => mq.matches && setOpen(false);
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onWide);
    return () => {
      root.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onWide);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex size-11 items-center justify-center rounded text-navy lg:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? labels['nav.close'] : labels['nav.menu']}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X aria-hidden size={26} /> : <Menu aria-hidden size={26} />}
      </button>
      <div
        id="mobile-menu"
        ref={panelRef}
        inert={!open}
        aria-hidden={!open}
        className={`fixed inset-x-0 top-[var(--header-h)] z-40 flex h-[calc(100dvh-var(--header-h))] flex-col overflow-y-auto overscroll-contain border-t border-line bg-white px-[var(--spacing-gutter)] pt-1 pb-[max(1rem,env(safe-area-inset-bottom))] transition-[opacity,transform,visibility] duration-300 ease-out lg:hidden ${
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-3 opacity-0'
        }`}
      >
        {/* المجموعة كلها في منتصف المساحة؛ ارتفاع البند نسبة من ارتفاع الشاشة بحد أدنى 44px للمس */}
        <div aria-hidden className="min-h-0 flex-1" />
        <nav aria-label={labels['nav.main']} className="shrink-0">
          <ul className="flex flex-col">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="flex h-[clamp(2.75rem,7.2dvh,4rem)] border-b border-line last:border-b-0">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex w-full items-center justify-center text-[length:clamp(1.05rem,2.7dvh,1.4rem)] font-semibold ${active ? 'text-orange' : 'text-navy'}`}
                  >
                    {labels[item.key]}
                    {active && <span aria-hidden className="absolute bottom-[18%] h-[3px] w-8 rounded-full bg-orange" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-[clamp(0.75rem,2.5dvh,1.5rem)] grid shrink-0 grid-cols-2 gap-3">
          <Link href="/search" className="btn btn-outline">
            <Search aria-hidden size={18} /> {labels['nav.search']}
          </Link>
          <Link href="/submit" className="btn btn-primary">
            {labels['nav.submit']}
          </Link>
        </div>
        <div className="mt-2 flex shrink-0 justify-center">{langForm}</div>
        <div aria-hidden className="min-h-0 flex-1" />
      </div>
    </>
  );
}
