import Image from 'next/image';
import type { Lang } from '@/lib/i18n/dict';

type Asset = { url: string; width: number | null; height: number | null; altAr: string | null; altEn: string | null };

/** صورة من مكتبة الوسائط بأبعادها الحقيقية ووصفها البديل حسب اللغة. */
export function Media({
  asset,
  lang,
  sizes,
  className,
  fill = false,
  priority = false,
  // الأصول الحالية صغيرة، فإعادة ضغطها بجودة منخفضة تُفقدها التفاصيل
  quality = 90,
}: {
  asset: Asset;
  lang: Lang;
  sizes: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
}) {
  const alt = (lang === 'en' ? asset.altEn || asset.altAr : asset.altAr) ?? '';
  if (fill) {
    return <Image src={asset.url} alt={alt} fill sizes={sizes} className={className} priority={priority} quality={quality} />;
  }
  return (
    <Image
      src={asset.url}
      alt={alt}
      width={asset.width ?? 1200}
      height={asset.height ?? 800}
      sizes={sizes}
      className={className}
      priority={priority}
      quality={quality}
    />
  );
}

/** بديل بصري عند غياب الصورة (لا نستخدم صورًا عشوائية). */
export function MediaPlaceholder({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-mint-25 text-sm text-ink-soft ${className}`} role={label ? 'img' : undefined} aria-label={label}>
      <svg aria-hidden viewBox="0 0 120 40" className="w-24 text-orange/60" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 20c10-30 20 30 30 0s20 30 30 0 20 30 30 0 15 20 20 0" />
      </svg>
    </div>
  );
}
