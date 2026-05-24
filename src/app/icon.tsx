import { ImageResponse } from 'next/og';
import { appIconSvgDataUrl } from '@/lib/app-icon-svg';
import { FAVICON_LOGO_SCALE, renderAppIconImage } from '@/lib/app-icon-render';

/** Favicon + tab trình duyệt (512×512 nguồn, hiển thị ~16–32px). */

export const runtime = 'nodejs';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <>{renderAppIconImage(appIconSvgDataUrl(), size.width, FAVICON_LOGO_SCALE)}</>,
    { ...size },
  );
}
