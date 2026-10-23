import { ArrowLeft } from 'lucide-react';

/** سهم "التالي" يتبع اتجاه اللغة: لليسار في العربية ولليمين في الإنجليزية. */
export function Arrow({ size = 16, className = '' }: { size?: number; className?: string }) {
  return <ArrowLeft aria-hidden size={size} strokeWidth={2} className={`shrink-0 ltr:rotate-180 ${className}`} />;
}
