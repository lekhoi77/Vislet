import { ImageResponse } from 'next/og';
import { appIconSvgDataUrl } from '@/lib/app-icon-svg';
import { renderAppIconImage } from '@/lib/app-icon-render';

/**
 * Apple touch icon (180×180 PNG) — cùng safe zone với PWA icon.
 */

export const runtime = 'nodejs';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <>{renderAppIconImage(appIconSvgDataUrl(), size.width)}</>,
    { ...size },
  );
}
