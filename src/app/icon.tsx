import { ImageResponse } from 'next/og';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Dynamic PWA / tab icon — converts /public/logo-small.svg into 512x512 PNG so
 * Windows/Android PWA installers (which often require PNG) show the app icon.
 */

export const runtime = 'nodejs';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  const svgPath = path.join(process.cwd(), 'public', 'logo-small.svg');
  const svg = fs.readFileSync(svgPath, 'utf-8');
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} width={size.width} height={size.height} alt="" />
      </div>
    ),
    { ...size },
  );
}
