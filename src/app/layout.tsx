import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

const CLARITY_ID = 'wux9dhd9zc';
const GTM_ID = 'GTM-T6TDDGKH';

export const metadata: Metadata = {
  title: 'Vislet — Quản lý tài chính cá nhân',
  description:
    'Theo dõi thu nhập, chi tiêu, mục tiêu tài chính và quản lý nợ một cách đơn giản.',
  keywords: ['tài chính', 'chi tiêu', 'thu nhập', 'quản lý nợ', 'tiết kiệm'],
  applicationName: 'Vislet',
  verification: {
    google: 'SsFk4Pz4lSXwswgMbPcgHROX7mS3yt45yerPf8CKCKM',
  },
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
        <Script id="gtm-head" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");`}
        </Script>
      </body>
    </html>
  );
}
