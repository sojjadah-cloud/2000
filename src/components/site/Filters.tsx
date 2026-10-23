import Link from 'next/link';
import { Search } from 'lucide-react';

/** شرائح تصفية تعمل كروابط حقيقية (تعمل دون JavaScript ويحفظها المتصفح في السجل). */
export function FilterChips({ items, label }: { items: Array<{ label: string; href: string; active: boolean }>; label: string }) {
  return (
    <nav aria-label={label} className="-mx-[var(--spacing-gutter)] overflow-x-auto px-[var(--spacing-gutter)] [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} scroll={false} aria-current={i.active ? 'true' : undefined} className="chip">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** حقل بحث بنموذج GET يحتفظ بباقي المعاملات. */
export function SearchField({
  action,
  name = 'q',
  value,
  placeholder,
  label,
  keep = {},
  className = '',
}: {
  action: string;
  name?: string;
  value?: string;
  placeholder: string;
  label: string;
  keep?: Record<string, string | undefined>;
  className?: string;
}) {
  return (
    <form action={action} role="search" className={`relative ${className}`}>
      {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label className="sr-only" htmlFor={`search-${name}`}>
        {label}
      </label>
      <input
        id={`search-${name}`}
        name={name}
        type="search"
        defaultValue={value}
        placeholder={placeholder}
        enterKeyHint="search"
        className="field h-12 pe-12"
        maxLength={100}
      />
      <button type="submit" aria-label={label} className="absolute inset-y-0 end-0 flex w-12 items-center justify-center text-navy hover:text-orange">
        <Search aria-hidden size={19} />
      </button>
    </form>
  );
}
