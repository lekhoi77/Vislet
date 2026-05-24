import type { ReactNode } from 'react';

/** Logo chiếm ~82% canvas — khớp safe zone iOS / Android (tránh icon “phình” khi cài PWA). */
export const APP_ICON_LOGO_SCALE = 0.82;

export function renderAppIconImage(svgDataUrl: string, canvasSize: number): ReactNode {
  const logoSize = Math.round(canvasSize * APP_ICON_LOGO_SCALE);

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
