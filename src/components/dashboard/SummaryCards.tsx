'use client';

import { Transaction } from '@/lib/types';
import { formatVND } from '@/lib/format';
import { SummaryCardSkeleton } from './SummaryCardSkeleton';

interface SummaryCardsProps {
  transactions: Transaction[];
  month: number;
  year: number;
  isLoading?: boolean;
}

export function SummaryCards({ transactions, month, year, isLoading }: SummaryCardsProps) {
  const filtered = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingAmount = filtered.filter(t => t.goal === 'saving' && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const incomeCount = filtered.filter(t => t.type === 'income').length;
  const expenseCount = filtered.filter(t => t.type === 'expense').length;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>
        <SummaryCardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Income */}
        <div
          className="flex flex-col gap-1 p-5 rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center gap-1.5">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--income)' }} />
            <span className="text-overline">Thu nhập</span>
          </div>
          <p className="text-2xl font-bold amount" style={{ color: 'var(--income)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {formatVND(income)}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {incomeCount} giao dịch
          </p>
        </div>

        {/* Expense */}
        <div
          className="flex flex-col gap-1 p-5 rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center gap-1.5">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--expense)' }} />
            <span className="text-overline">Chi tiêu</span>
          </div>
          <p className="text-2xl font-bold amount" style={{ color: 'var(--expense)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {formatVND(expense)}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {expenseCount} giao dịch
          </p>
        </div>
      </div>

      {/* Balance */}
      <div
        className="flex flex-col gap-1 p-5 rounded-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center gap-1.5">
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
          <span className="text-overline">Số dư hiện tại</span>
        </div>
        <p
          className="text-2xl font-bold amount"
          style={{
            color: balance >= 0 ? 'var(--foreground)' : 'var(--expense)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em'
          }}
        >
          {formatVND(Math.max(0, balance))}
        </p>
        {savingAmount > 0 && (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Trong đó {formatVND(savingAmount)} đang tiết kiệm
          </p>
        )}
      </div>
    </div>
  );
}
