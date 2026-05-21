'use client';

import { useMemo } from 'react';
import { Transaction } from '@/lib/types';
import { formatVND, formatVNDShort } from '@/lib/format';

interface ExpenseHeatmapProps {
  transactions: Transaction[];
  month: number;
  year: number;
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Orange shades from empty → max
const SHADE_COLORS = [
  'hsl(220, 12%, 95%)',   // 0 — empty
  'hsl(28, 95%, 92%)',    // 1 — very low
  'hsl(26, 90%, 80%)',    // 2 — low
  'hsl(24, 92%, 65%)',    // 3 — mid
  'hsl(22, 92%, 50%)',    // 4 — high
];

interface DayCell {
  day: number | null;
  amount: number;
  level: number;
}

export function ExpenseHeatmap({ transactions, month, year }: ExpenseHeatmapProps) {
  const { days, maxAmount, totalAmount, activeDays } = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstWeekday = (firstDay.getDay() + 6) % 7;

    const dayAmounts: Record<number, number> = {};
    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      const d = new Date(tx.date);
      if (d.getFullYear() !== year || d.getMonth() !== month - 1) continue;
      const day = d.getDate();
      dayAmounts[day] = (dayAmounts[day] || 0) + tx.amount;
    }

    const amounts = Object.values(dayAmounts);
    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
    const totalAmount = amounts.reduce((s, a) => s + a, 0);
    const activeDays = amounts.length;

    const cells: DayCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: null, amount: 0, level: -1 });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const amount = dayAmounts[d] || 0;
      let level = 0;
      if (amount > 0 && maxAmount > 0) {
        const ratio = amount / maxAmount;
        if (ratio > 0.75) level = 4;
        else if (ratio > 0.5) level = 3;
        else if (ratio > 0.25) level = 2;
        else level = 1;
      }
      cells.push({ day: d, amount, level });
    }
    return { days: cells, maxAmount, totalAmount, activeDays };
  }, [transactions, month, year]);

  return (
    <div
      className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <p className="text-overline">Heatmap chi tiêu</p>
        <p className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {activeDays > 0 ? `${activeDays} ngày · cao nhất ${formatVNDShort(maxAmount)}` : 'Chưa có dữ liệu'}
        </p>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-1">
        {WEEKDAY_LABELS.map(label => (
          <div
            key={label}
            className="text-center text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-7 gap-1 px-3 flex-1 content-start">
        {days.map((c, i) => {
          if (c.day === null) {
            return <div key={i} aria-hidden />;
          }
          const isDark = c.level >= 3;
          return (
            <div
              key={i}
              title={`Ngày ${c.day}: ${c.amount > 0 ? formatVND(c.amount) : 'Không chi tiêu'}`}
              className="rounded-md aspect-square flex items-center justify-center text-[10px] transition-colors"
              style={{
                background: SHADE_COLORS[c.level],
                color: isDark ? '#fff' : 'var(--muted-foreground)',
                fontWeight: c.level > 0 ? 600 : 400,
              }}
            >
              {c.day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 mt-1">
        <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          Tổng: <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{formatVND(totalAmount)}</span>
        </p>
        <div className="flex items-center gap-1">
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Ít</span>
          <div className="flex gap-0.5">
            {SHADE_COLORS.map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
            ))}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Nhiều</span>
        </div>
      </div>
    </div>
  );
}
