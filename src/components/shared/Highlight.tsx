import { highlightSegments } from '@/lib/search';

interface HighlightProps {
  text: string;
  query: string;
  /** CSS class for the wrapping element (e.g. preserves truncation classes). */
  className?: string;
  /** Inline style for the wrapping element. */
  style?: React.CSSProperties;
}

/**
 * Render `text` with substrings matching `query` wrapped in an orange mark.
 * Diacritic- and case-insensitive (Vietnamese-aware via lib/search).
 */
export function Highlight({ text, query, className, style }: HighlightProps) {
  if (!query.trim() || !text) {
    return <span className={className} style={style}>{text}</span>;
  }

  const segments = highlightSegments(text, query);

  return (
    <span className={className} style={style}>
      {segments.map((seg, i) =>
        seg.isMatch ? (
          <mark
            key={i}
            style={{
              background: 'var(--orange-soft)',
              color: 'var(--orange)',
              padding: '0 1px',
              borderRadius: 3,
              fontWeight: 'inherit',
            }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
}
