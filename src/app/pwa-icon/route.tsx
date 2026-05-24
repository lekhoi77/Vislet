import { ImageResponse } from 'next/og';
import { appIconSvgDataUrl } from '@/lib/app-icon-svg';
import { PWA_ICON_LOGO_SCALE, renderAppIconImage } from '@/lib/app-icon-render';

const SIZE = 512;

/** PNG 512×512 cho manifest PWA — có safe zone, khác favicon tab trình duyệt. */

export async function GET() {
  return new ImageResponse(
    <>{renderAppIconImage(appIconSvgDataUrl(), SIZE, PWA_ICON_LOGO_SCALE)}</>,
    { width: SIZE, height: SIZE },
  );
}
