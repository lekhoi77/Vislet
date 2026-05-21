'use client';

import { useState } from 'react';
import { Transaction, TransactionGoal, TransactionSource } from '@/lib/types';
import { formatVND } from '@/lib/format';
import { GOAL_LABELS, SOURCE_LABELS } from '@/lib/constants';
import { Building2, Wallet, Smartphone, PiggyBank, Plane, Clock, Tag, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterBy = 'goal' | 'source';
type SortBy = 'amount' | 'count';

interface ExpenseBreakdownProps {
  transactions: Transaction[];
  month: number;
  year: number;
}

const GOAL_ICONS: Record<TransactionGoal, React.ReactNode> = {
  none: <Tag size={14} />,
  saving: <PiggyBank size={14} />,
  travel: <Plane size={14} />,
  soon: <Clock size={14} />,
};

const SOURCE_ICONS: Record<TransactionSource, React.ReactNode> = {
  bank: <Building2 size={14} />,
  cash: <Wallet size={14} />,
  momo: <Smartphone size={14} />,
};

export function ExpenseBreakdown({ transactions, month, year }: ExpenseBreakdownProps) {
  const [filterBy, setFilterBy] = useState<FilterBy>('goal');
  const [sortBy, setSortBy] = useState<SortBy>('amount');

  const monthExpenses = transactions.filter(tx => {
    const d = new Date(tx.date);
    return tx.type === 'expense' && d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const total = monthExpenses.reduce((s, t) => s + t.amount, 0);

  type GroupKey = TransactionGoal | TransactionSource;
  const groups = new Map<GroupKey, { amount: number; count: number }>();

  const keys: GroupKey[] = filterBy === 'goal'
    ? ['none', 'saving', 'travel', 'soon']
    : ['bank', 'cash', 'momo'];

  keys.forEach(k => groups.set(k, { amount: 0, count: 0 }));

  monthExpenses.forEach(tx => {
    const key = filterBy === 'goal' ? tx.goal : tx.source;
    if (!key) return;
    let g = groups.get(key);
    if (!g) {
      g = { amount: 0, count: 0 };
      groups.set(key, g);
    }
    g.amount += tx.amount;
    g.count += 1;
  });

  const rows = [...groups.entries()]
    .filter(([, g]) => g.amount > 0)
    .sort((a, b) => sortBy === 'amount' ? b[1].amount - a[1].amount : b[1].count - a[1].count);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
          Chi tiêu theo {filterBy === 'goal' ? 'mục tiêu' : 'nguồn'}
        </p>
        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['goal', 'source'] as FilterBy[]).map(f => (
              <button
                key={f}
                onClick={() => setFilterBy(f)}
                className="px-2.5 py-1 text-sm font-medium transition-colors"
                style={{
                  background: filterBy === f ? 'var(--primary)' : 'transparent',
                  color: filterBy === f ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
              >
                {f === 'goal' ? 'Mục tiêu' : 'Nguồn'}
              </button>
            ))}
          </div>
          {/* Sort toggle */}
          <button
            onClick={() => setSortBy(s => s === 'amount' ? 'count' : 'amount')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          >
            {sortBy === 'amount' ? 'Số tiền' : 'Số lần'}
            <ChevronDown size={11} />
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>
          Không có chi tiêu trong tháng này
        </p>
      ) : (
        <div className="flex flex-col">
          {rows.map(([key, g], i) => {
            const label = (filterBy === 'goal'
              ? GOAL_LABELS[key as TransactionGoal]
              : SOURCE_LABELS[key as TransactionSource]) ?? key;
            const icon = filterBy === 'goal'
              ? GOAL_ICONS[key as TransactionGoal]
              : SOURCE_ICONS[key as TransactionSource];
            const pct = total > 0 ? (g.amount / total) * 100 : 0;

            return (
              <div
                key={key}
                className={cn('px-4 py-3', i > 0 && 'border-t')}
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                    {icon}
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</span>
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{g.count} lần</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold amount" style={{ color: 'var(--expense)' }}>
                      {formatVND(g.amount)}
                    </span>
                    <span className="text-sm ml-1.5" style={{ color: 'var(--muted-foreground)' }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: 'var(--expense)' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
