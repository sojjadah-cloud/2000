'use client';

import { useState } from 'react';
import { Check, Link2, Mail } from 'lucide-react';

/** روابط مشاركة تستخدم الرابط المطلق الصحيح للصفحة. */
export function ShareLinks({ url, title, labels }: { url: string; title: string; labels: { share: string; copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}`, icon: <span className="text-[0.8rem] font-bold">WA</span> },
    { name: 'X', href: `https://x.com/intent/post?url=${u}&text=${t}`, icon: <span className="text-[0.85rem] font-bold">X</span> },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: <span className="text-[0.8rem] font-bold">in</span> },
    { name: 'Email', href: `mailto:?subject=${t}&body=${u}`, icon: <Mail aria-hidden size={17} /> },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="me-1 text-sm font-semibold text-navy">{labels.share}</span>
      {links.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target={l.name === 'Email' ? undefined : '_blank'}
          rel="noopener noreferrer"
          aria-label={`${labels.share}: ${l.name}`}
          className="inline-flex size-11 items-center justify-center rounded-full border border-line text-navy transition-colors hover:border-orange hover:text-orange"
        >
          {l.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } catch {
            /* المتصفح منع الوصول للحافظة */
          }
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-navy hover:border-orange hover:text-orange"
      >
        {copied ? <Check aria-hidden size={16} /> : <Link2 aria-hidden size={16} />}
        <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
      </button>
    </div>
  );
}
