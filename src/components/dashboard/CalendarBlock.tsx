'use client';

import { useMemo, useState } from 'react';
import { Transaction, Debt } from '@/lib/types';
import { DayDetailSheet } from './DayDetailSheet';

interface CalendarBlockProps {
  transactions: Transaction[];
  debts: Debt[];
  month: number;
  year: number;
  onEdit?: (tx: Transaction) => void;
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

interface DayCell {
  day: number | null;
  isToday: boolean;
  incomeCount: number;
  expenseCount: number;
  debtCount: number;
}

export function CalendarBlock({ transactions, debts, month, year, onEdit }: CalendarBlockProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const days = useMemo<DayCell[]>(() => {
    const now = new Date();
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstWeekday = (firstDay.getDay() + 6) % 7;

    const cells: DayCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: null, isToday: false, incomeCount: 0, expenseCount: 0, debtCount: 0 });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        now.getFullYear() === year &&
        now.getMonth() === month - 1 &&
        now.getDate() === d;

      let incomeCount = 0;
      let expenseCount = 0;
      for (const tx of transactions) {
        const td = new Date(tx.date);
        if (td.getFullYear() !== year || td.getMonth() !== month - 1 || td.getDate() !== d) continue;
        if (tx.type === 'income') incomeCount++;
        else if (tx.type === 'expense') expenseCount++;
      }

      let debtCount = 0;
      for (const debt of debts) {
        if (!debt.dueDate) continue;
        const dd = new Date(debt.dueDate);
        if (dd.getFullYear() === year && dd.getMonth() === month - 1 && dd.getDate() === d) {
          debtCount++;
        }
      }

      cells.push({ day: d, isToday, incomeCount, expenseCount, debtCount });
    }
    return cells;
  }, [transactions, debts, month, year]);

  const selectedDate = selectedDay !== null ? new Date(year, month - 1, selectedDay) : null;

  return (
    <div
      className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-4">
        <p className="text-overline">Lịch hoạt động</p>
        <div className="flex items-center gap-2.5 text-[14px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
          <span className="flex items-center gap-1">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--income)' }} /> Thu
          </span>
          <span className="flex items-center gap-1">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)' }} /> Chi
          </span>
          <span className="flex items-center gap-1">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--expense)' }} /> Nợ
          </span>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-2">
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

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-3 flex-1 content-start">
        {days.map((c, i) => {
          if (c.day === null) {
            return <div key={i} aria-hidden />;
          }
          const total = c.incomeCount + c.expenseCount + c.debtCount;
          const hasAny = total > 0;
          // Dots: per transaction. On mobile shrink and tighten gap when crowded.
          const dotItems: { key: string; color: string }[] = [
            ...Array.from({ length: c.incomeCount }, (_, k) => ({ key: `i${k}`, color: 'var(--income)' })),
            ...Array.from({ length: c.expenseCount }, (_, k) => ({ key: `e${k}`, color: 'var(--orange)' })),
            ...Array.from({ length: c.debtCount }, (_, k) => ({ key: `d${k}`, color: 'var(--expense)' })),
          ];
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDay(c.day)}
              className="flex flex-col items-center justify-start aspect-square rounded-lg pt-1 transition-colors hover:bg-[var(--muted)] active:scale-95"
              style={{
                background: c.isToday ? 'var(--primary-soft)' : 'transparent',
                border: c.isToday ? '1px solid var(--primary-muted)' : '1px solid transparent',
                cursor: 'pointer',
              }}
              aria-label={`Ngày ${c.day}${hasAny ? `, ${total} hoạt động` : ''}`}
            >
              <span
                className="text-[13px] leading-none"
                style={{
                  color: c.isToday ? 'var(--primary)' : 'var(--foreground)',
                  fontWeight: c.isToday ? 700 : 500,
                }}
              >
                {c.day}
              </span>
              <div
                className={`flex flex-wrap justify-center mt-1.5 min-h-[8px] cal-dots ${total > 6 ? 'is-crowded' : ''}`}
              >
                {dotItems.map(d => (
                  <span key={d.key} className="cal-dot" style={{ background: d.color }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <DayDetailSheet
        date={selectedDate}
        transactions={transactions}
        debts={debts}
        filterType="all"
        onEdit={onEdit}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
}
