'use client';

import { useMemo } from 'react';
import { Transaction, Debt } from '@/lib/types';

interface CalendarBlockProps {
  transactions: Transaction[];
  debts: Debt[];
  month: number;
  year: number;
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

interface DayCell {
  day: number | null;
  isToday: boolean;
  hasIncome: boolean;
  hasExpense: boolean;
  hasDebt: boolean;
}

export function CalendarBlock({ transactions, debts, month, year }: CalendarBlockProps) {
  const days = useMemo<DayCell[]>(() => {
    const now = new Date();
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstWeekday = (firstDay.getDay() + 6) % 7;

    const cells: DayCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: null, isToday: false, hasIncome: false, hasExpense: false, hasDebt: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        now.getFullYear() === year &&
        now.getMonth() === month - 1 &&
        now.getDate() === d;

      let hasIncome = false;
      let hasExpense = false;
      for (const tx of transactions) {
        const td = new Date(tx.date);
        if (td.getFullYear() !== year || td.getMonth() !== month - 1 || td.getDate() !== d) continue;
        if (tx.type === 'income') hasIncome = true;
        else if (tx.type === 'expense') hasExpense = true;
        if (hasIncome && hasExpense) break;
      }

      let hasDebt = false;
      for (const debt of debts) {
        if (!debt.dueDate) continue;
        const dd = new Date(debt.dueDate);
        if (dd.getFullYear() === year && dd.getMonth() === month - 1 && dd.getDate() === d) {
          hasDebt = true;
          break;
        }
      }

      cells.push({ day: d, isToday, hasIncome, hasExpense, hasDebt });
    }
    return cells;
  }, [transactions, debts, month, year]);

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
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--income)' }} /> Thu
          </span>
          <span className="flex items-center gap-1">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)' }} /> Chi
          </span>
          <span className="flex items-center gap-1">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--expense)' }} /> Nợ
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
          return (
            <div
              key={i}
              className="flex flex-col items-center justify-start aspect-square rounded-lg pt-1"
              style={{
                background: c.isToday ? 'var(--primary-soft)' : 'transparent',
                border: c.isToday ? '1px solid var(--primary-muted)' : '1px solid transparent',
              }}
            >
              <span
                className="text-[11px] leading-none"
                style={{
                  color: c.isToday ? 'var(--primary)' : 'var(--foreground)',
                  fontWeight: c.isToday ? 700 : 500,
                }}
              >
                {c.day}
              </span>
              <div className="flex gap-0.5 mt-1 min-h-[5px]">
                {c.hasIncome && (
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--income)' }} />
                )}
                {c.hasExpense && (
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--orange)' }} />
                )}
                {c.hasDebt && (
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--expense)' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
