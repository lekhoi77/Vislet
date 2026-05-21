import { ImageResponse } from 'next/og';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Apple touch icon (180x180 PNG) — dùng cho khi user "Add to Home Screen"
 * trên iOS, hoặc bookmark trên Safari.
 */

export const runtime = 'nodejs';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  const svgPath = path.join(process.cwd(), 'public', 'logo.svg');
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
