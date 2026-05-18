'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover } from '@base-ui/react/popover';
import { cn } from '@/lib/utils';

const MONTH_NAMES = ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'];

interface MonthSelectorProps {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect?: (month: number, year: number) => void;
}

export function MonthSelector({ month, year, onPrev, onNext, onSelect }: MonthSelectorProps) {
  const [pickerYear, setPickerYear] = useState(year);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--muted)] transition-colors"
        aria-label="Tháng trước"
      >
        <ChevronLeft size={18} style={{ color: 'var(--muted-foreground)' }} />
      </button>

      <Popover.Root onOpenChange={open => { if (open) setPickerYear(year); }}>
        <Popover.Trigger
          className="text-sm font-semibold hover:text-[var(--primary)] transition-colors cursor-pointer"
          style={{ color: 'var(--foreground)', minWidth: 120, textAlign: 'center', background: 'none', border: 'none' }}
        >
          Tháng {month}, {year}
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner side="bottom" align="center" sideOffset={6} className="z-50">
            <Popover.Popup
              className="rounded-xl p-3 shadow-lg"
              style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                minWidth: 220,
              }}
            >
              {/* Year navigation */}
              <div className="flex items-center justify-between mb-2 px-1">
                <button
                  onClick={() => setPickerYear(y => y - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <ChevronLeft size={14} style={{ color: 'var(--muted-foreground)' }} />
                </button>
                <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{pickerYear}</span>
                <button
                  onClick={() => setPickerYear(y => y + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                </button>
              </div>

              {/* Month grid */}
              <div className="grid grid-cols-4 gap-1">
                {MONTH_NAMES.map((name, i) => {
                  const m = i + 1;
                  const isActive = m === month && pickerYear === year;
                  return (
                    <Popover.Close
                      key={m}
                      render={
                        <button
                          onClick={() => onSelect?.(m, pickerYear)}
                          className={cn(
                            'h-8 rounded-lg text-xs font-medium transition-colors',
                            isActive
                              ? 'text-[var(--primary-foreground)]'
                              : 'hover:bg-[var(--muted)] text-[var(--foreground)]'
                          )}
                          style={isActive ? { background: 'var(--primary)' } : {}}
                        />
                      }
                    >
                      {name}
                    </Popover.Close>
                  );
                })}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

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
