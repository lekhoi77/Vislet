import { ImageResponse } from 'next/og';
import { appIconSvgDataUrl } from '@/lib/app-icon-svg';
import { PWA_ICON_LOGO_SCALE, pwaIconRenderOptions, renderAppIconImage } from '@/lib/app-icon-render';

/** Apple touch icon — có padding cho Add to Home Screen. */

export const runtime = 'nodejs';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <>
      {renderAppIconImage(
        appIconSvgDataUrl(),
        size.width,
        PWA_ICON_LOGO_SCALE,
        pwaIconRenderOptions,
      )}
    </>,
    { ...size },
  );
}
