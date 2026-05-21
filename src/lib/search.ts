/**
 * Vietnamese-aware search utilities.
 *
 * normalizeVi() decomposes diacritics (NFD) and strips combining marks, plus
 * folds đ→d. This keeps character count 1:1 with the precomposed original,
 * so indices computed on the normalised string can be used to slice the
 * original string for highlighting.
 *
 * E.g. "nước" → "nuoc"; typing "nu" matches "nư..." in the original.
 */

// eslint-disable-next-line no-misleading-character-class
const COMBINING_MARKS = /[̀-ͯ]/g;

export function normalizeVi(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function matchesQuery(text: string, query: string): boolean {
  const q = normalizeVi(query.trim());
  if (!q) return true;
  return normalizeVi(text).includes(q);
}

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Split `text` into segments around case- & diacritic-insensitive matches of
 * `query`. The slice indices computed on the normalised string map 1:1 onto
 * the original (precomposed) text, so the returned segments preserve the
 * original characters with diacritics intact.
 */
export function highlightSegments(text: string, query: string): HighlightSegment[] {
  const q = normalizeVi(query.trim());
  if (!q || !text) return [{ text, isMatch: false }];

  const haystack = normalizeVi(text);
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  while (cursor < haystack.length) {
    const hit = haystack.indexOf(q, cursor);
    if (hit === -1) {
      if (cursor < text.length) segments.push({ text: text.slice(cursor), isMatch: false });
      break;
    }
    if (hit > cursor) segments.push({ text: text.slice(cursor, hit), isMatch: false });
    segments.push({ text: text.slice(hit, hit + q.length), isMatch: true });
    cursor = hit + q.length;
  }

  return segments.length > 0 ? segments : [{ text, isMatch: false }];
}
