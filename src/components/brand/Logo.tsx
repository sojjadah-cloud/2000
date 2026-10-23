import Image from 'next/image';

// الشعار الأصلي المستخرج من دليل الهوية (PNG بخلفية شفافة والحروف مفرّغة).
// لا يُمدد ولا يُعاد رسمه؛ العرض فقط يتغير والارتفاع يتبع النسبة الأصلية.
const VARIANTS = {
  black: { src: '/brand/logo-black.png', width: 744, height: 660 },
  white: { src: '/brand/logo-white.png', width: 1343, height: 1194 },
} as const;

export function Logo({
  variant = 'black',
  width = 112,
  priority = false,
  label = 'ألفين | TWO THOUSAND',
}: {
  variant?: keyof typeof VARIANTS;
  width?: number;
  priority?: boolean;
  label?: string;
}) {
  const v = VARIANTS[variant];
  return (
    <Image
      src={v.src}
      alt={label}
      width={v.width}
      height={v.height}
      priority={priority}
      sizes={`${width}px`}
      style={{ width, height: 'auto' }}
    />
  );
}
