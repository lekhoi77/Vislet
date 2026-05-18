import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vislet — Quản lý tài chính cá nhân',
  description: 'Theo dõi thu nhập, chi tiêu, mục tiêu tài chính và quản lý nợ một cách đơn giản.',
  keywords: ['tài chính', 'chi tiêu', 'thu nhập', 'quản lý nợ', 'tiết kiệm'],
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
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
