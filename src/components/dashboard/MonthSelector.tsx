'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear } from '@/lib/format';

interface MonthSelectorProps {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthSelector({ month, year, onPrev, onNext }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--muted)] transition-colors"
        aria-label="Tháng trước"
      >
        <ChevronLeft size={18} style={{ color: 'var(--muted-foreground)' }} />
      </button>
      <span className="text-sm font-semibold" style={{ color: 'var(--foreground)', minWidth: 120, textAlign: 'center' }}>
        {formatMonthYear(month, year)}
      </span>
      <button
        onClick={onNext}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--muted)] transition-colors"
        aria-label="Tháng sau"
      >
        <ChevronRight size={18} style={{ color: 'var(--muted-foreground)' }} />
      </button>
    </div>
  );
}
