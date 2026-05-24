import { ImageResponse } from 'next/og';
import { appIconSvgDataUrl } from '@/lib/app-icon-svg';
import { renderAppIconImage } from '@/lib/app-icon-render';

/**
 * PWA / tab icon (512×512 PNG) — logo có padding safe zone, không full-bleed.
 */

export const runtime = 'nodejs';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <>{renderAppIconImage(appIconSvgDataUrl(), size.width)}</>,
    { ...size },
  );
}
