import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vislet — Quản lý tài chính cá nhân',
  description:
    'Theo dõi thu nhập, chi tiêu, danh mục tài chính và quản lý nợ một cách đơn giản.',
  keywords: ['tài chính', 'chi tiêu', 'thu nhập', 'quản lý nợ', 'tiết kiệm'],
  applicationName: 'Vislet',
  appleWebApp: {
    capable: true,
    title: 'Vislet',
    statusBarStyle: 'default',
  },
  // Icons are auto-wired via src/app/icon.tsx + src/app/apple-icon.tsx
  // Manifest is auto-wired via src/app/manifest.ts
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#129276',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
