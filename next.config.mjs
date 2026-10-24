// إعدادات Next (JavaScript بدل TypeScript حتى لا يحتاج خادم الإنتاج إلى حزمة typescript).

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // AVIF أولًا: ملفات أصغر بنحو الثلث مع الجودة نفسها، ثم WebP للمتصفحات الأقدم
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    localPatterns: [
      { pathname: '/demo/**', search: '' },
      { pathname: '/brand/**', search: '' },
      { pathname: '/media/**', search: '' },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'sanitize-html'],
  async headers() {
    // الأصول الثابتة في public كانت تُرسل بـ max-age=0 فيتحقق المتصفح منها مع كل زيارة
    const week = 'public, max-age=604800, stale-while-revalidate=86400';
    return [
      { source: '/brand/:path*', headers: [{ key: 'Cache-Control', value: week }] },
      { source: '/demo/:path*', headers: [{ key: 'Cache-Control', value: week }] },
      { source: '/vendor/:path*', headers: [{ key: 'Cache-Control', value: week }] },
    ];
  },
};

export default nextConfig;
