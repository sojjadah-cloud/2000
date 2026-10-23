'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

/** قائمة منسدلة تنقل إلى رابط عند التغيير (ترتيب، سنة، مجال). مع زر إرسال احتياطي دون JavaScript. */
export function SelectNav({
  label,
  value,
  options,
  className = '',
}: {
  label: string;
  value: string;
  options: Array<{ label: string; href: string; value: string }>;
  className?: string;
}) {
  const router = useRouter();
  return (
    <div className={`relative ${className}`}>
      <label className="sr-only" htmlFor={`select-${label}`}>
        {label}
      </label>
      <select
        id={`select-${label}`}
        value={value}
        onChange={(e) => {
          const o = options.find((x) => x.value === e.target.value);
          if (o) router.push(o.href, { scroll: false });
        }}
        className="field h-12 cursor-pointer appearance-none pe-10"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden size={18} className="pointer-events-none absolute inset-y-0 end-3 my-auto text-navy" />
    </div>
  );
}
