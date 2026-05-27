'use client';

import { useMemo, useState } from 'react';
import { Transaction } from '@/lib/types';
import { formatVND, formatVNDShort } from '@/lib/format';
import { DayDetailSheet } from './DayDetailSheet';

interface ExpenseHeatmapProps {
  transactions: Transaction[];
  month: number;
  year: number;
  onEdit?: (tx: Transaction) => void;
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

export function ExpenseHeatmap({ transactions, month, year, onEdit }: ExpenseHeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
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

    // Rank-based quantile: sắp xếp ngày có chi tăng dần → mỗi ngày được map sang
    // level theo percentile của nó. Tránh hiện tượng 1 outlier (vd tiền nhà 4.8M)
    // dìm hết các ngày khác xuống level 1 dù chênh nhau 10 lần.
    // Phân bổ: <25% → 1, <50% → 2, <75% → 3, >=75% → 4.
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    const rankOf = new Map<number, number>();
    sortedAmounts.forEach((amt, idx) => {
      // Dùng max index để các ngày cùng số tiền có cùng rank
      const existing = rankOf.get(amt);
      if (existing === undefined || idx > existing) rankOf.set(amt, idx);
    });
    const n = sortedAmounts.length;
    const amountToLevel = (amount: number): number => {
      if (amount <= 0 || n === 0) return 0;
      if (n === 1) return 4; // 1 ngày duy nhất → max color
      const rank = rankOf.get(amount) ?? 0;
      const pct = rank / (n - 1); // 0..1
      if (pct >= 0.75) return 4;
      if (pct >= 0.5)  return 3;
      if (pct >= 0.25) return 2;
      return 1;
    };

    const cells: DayCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: null, amount: 0, level: -1 });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const amount = dayAmounts[d] || 0;
      cells.push({ day: d, amount, level: amountToLevel(amount) });
    }
    return { days: cells, maxAmount, totalAmount, activeDays };
  }, [transactions, month, year]);

  return (
    <div
      className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-4">
        <p className="text-overline">Heatmap chi tiêu</p>
        <p className="text-[14px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {activeDays > 0 ? `${activeDays} ngày · cao nhất ${formatVNDShort(maxAmount)}` : 'Chưa có dữ liệu'}
        </p>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-1">
        {WEEKDAY_LABELS.map(label => (
          <div
            key={label}
            className="text-center text-[14px] font-semibold uppercase tracking-wide"
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
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDay(c.day)}
              title={`Ngày ${c.day}: ${c.amount > 0 ? formatVND(c.amount) : 'Không chi tiêu'}`}
              className="rounded-md aspect-square flex items-center justify-center text-[14px] transition-all hover:ring-2 hover:ring-offset-1 active:scale-95"
              style={{
                background: SHADE_COLORS[c.level],
                color: isDark ? '#fff' : 'var(--muted-foreground)',
                fontWeight: c.level > 0 ? 600 : 400,
                cursor: 'pointer',
              }}
              aria-label={`Ngày ${c.day}, chi tiêu ${c.amount > 0 ? formatVND(c.amount) : 'không có'}`}
            >
              {c.day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 mt-1">
        <p className="text-[14px]" style={{ color: 'var(--muted-foreground)' }}>
          Tổng: <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{formatVND(totalAmount)}</span>
        </p>
        <div className="flex items-center gap-1">
          <span className="text-[14px]" style={{ color: 'var(--muted-foreground)' }}>Ít</span>
          <div className="flex gap-0.5">
            {SHADE_COLORS.map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
            ))}
          </div>
          <span className="text-[14px]" style={{ color: 'var(--muted-foreground)' }}>Nhiều</span>
        </div>
      </div>

      <DayDetailSheet
        date={selectedDay !== null ? new Date(year, month - 1, selectedDay) : null}
        transactions={transactions}
        filterType="expense"
        onEdit={onEdit}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
}
