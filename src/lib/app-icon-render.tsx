import type { ReactNode } from 'react';

/** Favicon / tab trình duyệt — full canvas để logo không bị tí xíu. */
export const FAVICON_LOGO_SCALE = 1;

/** Icon cài lên màn hình chính — có padding safe zone iOS / Android. */
export const PWA_ICON_LOGO_SCALE = 0.86;

/**
 * Dịch logo xuống trong khung (wallet trong SVG hơi “nặng” phía trên).
 * Chỉ dùng cho apple-icon / pwa-icon, không áp favicon tab.
 */
export const PWA_ICON_OFFSET_Y_RATIO = 0.09;

export type AppIconRenderOptions = {
  offsetYRatio?: number;
};

export function renderAppIconImage(
  svgDataUrl: string,
  canvasSize: number,
  scale: number = FAVICON_LOGO_SCALE,
  options?: AppIconRenderOptions,
): ReactNode {
  const logoSize = Math.round(canvasSize * scale);
  const offsetY = options?.offsetYRatio
    ? Math.round(canvasSize * options.offsetYRatio)
    : 0;

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
      <img
        src={svgDataUrl}
        width={logoSize}
        height={logoSize}
        alt=""
        style={offsetY ? { marginTop: offsetY } : undefined}
      />
    </div>
  );
}

export const pwaIconRenderOptions: AppIconRenderOptions = {
  offsetYRatio: PWA_ICON_OFFSET_Y_RATIO,
};
