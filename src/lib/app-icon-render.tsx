import type { ReactNode } from 'react';

/** Favicon / tab trình duyệt — full canvas để logo không bị tí xíu. */
export const FAVICON_LOGO_SCALE = 1;

/** Icon cài lên màn hình chính — có padding safe zone iOS / Android. */
export const PWA_ICON_LOGO_SCALE = 0.82;

export function renderAppIconImage(
  svgDataUrl: string,
  canvasSize: number,
  scale: number = FAVICON_LOGO_SCALE,
): ReactNode {
  const logoSize = Math.round(canvasSize * scale);

  return (
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
      <img src={svgDataUrl} width={logoSize} height={logoSize} alt="" />
    </div>
  );
}
