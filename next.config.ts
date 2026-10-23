import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
    localPatterns: [
      { pathname: '/demo/**', search: '' },
      { pathname: '/brand/**', search: '' },
      { pathname: '/media/**', search: '' },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'sanitize-html'],
};

export default nextConfig;
