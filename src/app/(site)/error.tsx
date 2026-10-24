'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Coil } from '@/components/brand/Coil';

// خطأ غير متوقع في صفحة عامة: رسالة واضحة بلغتين وزر إعادة المحاولة (لا تفاصيل تقنية للزائر).
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error.digest ?? 'error');
  }, [error]);
  const en = typeof document !== 'undefined' && document.documentElement.lang === 'en';
  return (
    <div className="container-site flex min-h-[55vh] flex-col items-start justify-center py-16">
      <Coil loops={3} className="h-14 w-36" />
      <h1 className="mt-4 text-h1 font-bold text-navy">{en ? 'Something went wrong' : 'حدث خطأ غير متوقع'}</h1>
      <p className="mt-2 text-lg text-ink-muted">{en ? 'Please try again in a moment.' : 'حاول مرة أخرى بعد لحظات.'}</p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          {en ? 'Try again' : 'إعادة المحاولة'}
        </button>
        <Link href="/" className="btn btn-outline">
          {en ? 'Back to home' : 'العودة إلى الرئيسية'}
        </Link>
      </div>
    </div>
  );
}
