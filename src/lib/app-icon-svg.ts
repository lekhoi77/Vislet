import fs from 'node:fs';
import path from 'node:path';

const LOGO_PATH = path.join(process.cwd(), 'public', 'logo-small.svg');

export function readAppIconSvg(): string {
  return fs.readFileSync(LOGO_PATH, 'utf-8');
}

export function appIconSvgDataUrl(svg?: string): string {
  const content = svg ?? readAppIconSvg();
  return `data:image/svg+xml;base64,${Buffer.from(content).toString('base64')}`;
}
