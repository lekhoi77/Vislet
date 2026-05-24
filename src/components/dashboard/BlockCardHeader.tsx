'use client';

import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';

interface BlockCardHeaderProps {
  title?: string;
  onAdd?: () => void;
  addLabel?: string;
  /** View toggle buttons (Danh sách / Tỷ trọng / …) */
  children: ReactNode;
}

/**
 * Card block header: mobile stacks title+add over view toggles; desktop stays one row.
 */
export function BlockCardHeader({ title, onAdd, addLabel = 'Thêm', children }: BlockCardHeaderProps) {
  return (
    <div className="flex flex-col gap-2.5 px-3 pt-3 pb-2 md:flex-row md:items-center md:justify-between md:gap-2">
      <div className="flex min-w-0 items-center justify-between gap-2">
        {title ? (
          <p className="text-overline min-w-0 md:truncate">{title}</p>
        ) : (
          <span />
        )}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label={addLabel}
            className="add-btn-expand shrink-0"
          >
            <Plus size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            <span className="add-btn-label">{addLabel}</span>
          </button>
        )}
      </div>
      <div
        className="flex w-full rounded-lg p-0.5 md:w-auto md:shrink-0"
        style={{ background: 'var(--muted)', gap: 2 }}
      >
        {children}
      </div>
    </div>
  );
}
