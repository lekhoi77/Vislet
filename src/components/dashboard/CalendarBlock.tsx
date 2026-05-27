'use client';

import { useMemo, useState } from 'react';
import { Transaction, SharedDebt, isConfirmedDebt } from '@/lib/types';
import { DayDetailSheet } from './DayDetailSheet';

interface CalendarBlockProps {
  transactions: Transaction[];
  sharedDebts: SharedDebt[];
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
  hasDebt: boolean;
}


export function CalendarBlock({ transactions, sharedDebts, month, year, onEdit }: CalendarBlockProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const days = useMemo<DayCell[]>(() => {
    const now = new Date();
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstWeekday = (firstDay.getDay() + 6) % 7;

    const cells: DayCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: null, isToday: false, incomeCount: 0, expenseCount: 0, hasDebt: false });
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
        if (tx.type === 'income') incomeCount += 1;
        else if (tx.type === 'expense') expenseCount += 1;
      }

      let hasDebt = false;
      for (const debt of sharedDebts) {
        // Chỉ tính nợ đã được xác nhận thực sự — bỏ qua pending/rejected/cancelled
        if (!isConfirmedDebt(debt.status)) continue;
        // Sync với dashboard: ưu tiên dueDate, fallback về createdAt
        const dateStr = debt.dueDate ?? debt.createdAt;
        if (!dateStr) continue;
        const dd = new Date(dateStr);
        if (dd.getFullYear() === year && dd.getMonth() === month - 1 && dd.getDate() === d) {
          hasDebt = true;
          break;
        }
      }

      cells.push({ day: d, isToday, incomeCount, expenseCount, hasDebt });
    }
    return cells;
  }, [transactions, sharedDebts, month, year]);

  const selectedDate = selectedDay !== null ? new Date(year, month - 1, selectedDay) : null;

  return (
    <div
      className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <p className="text-overline">Lịch hoạt động</p>
        <div className="flex items-center gap-2.5 text-[14px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
          <span className="flex items-center gap-1">
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--income)', flexShrink: 0 }} /> Thu
          </span>
          <span className="flex items-center gap-1">
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }} /> Chi
          </span>
          <span className="flex items-center gap-1">
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'hsl(262, 60%, 55%)', flexShrink: 0 }} /> Nợ
          </span>
        </div>
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

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-3 flex-1 content-start">
        {days.map((c, i) => {
          if (c.day === null) {
            return <div key={i} aria-hidden />;
          }
          const hasAny = c.incomeCount > 0 || c.expenseCount > 0 || c.hasDebt;
          const totalDots = c.incomeCount + c.expenseCount + (c.hasDebt ? 1 : 0);
          const isCrowded = totalDots > 6;
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
              aria-label={`Ngày ${c.day}${hasAny ? ', có giao dịch' : ''}`}
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
              <div className={`cal-dots flex flex-wrap justify-center items-center mt-1 min-h-[6px] px-0.5${isCrowded ? ' is-crowded' : ''}`}>
                {Array.from({ length: c.incomeCount }).map((_, k) => (
                  <span key={`inc-${k}`} className="cal-dot" style={{ background: 'var(--income)' }} />
                ))}
                {Array.from({ length: c.expenseCount }).map((_, k) => (
                  <span key={`exp-${k}`} className="cal-dot" style={{ background: 'var(--orange)' }} />
                ))}
                {c.hasDebt && (
                  <span className="cal-dot" style={{ background: 'hsl(262, 60%, 55%)' }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <DayDetailSheet
        date={selectedDate}
        transactions={transactions}
        sharedDebts={sharedDebts}
        filterType="all"
        onEdit={onEdit}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
}
