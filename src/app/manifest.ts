import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vislet — Quản lý tài chính cá nhân',
    short_name: 'Vislet',
    description:
      'Theo dõi thu nhập, chi tiêu, danh mục tài chính và quản lý nợ một cách đơn giản.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#129276', // khớp với màu V trong logo
    lang: 'vi',
    icons: [
      // PNG icons sinh động qua src/app/icon.tsx (Next.js metadata API)
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
