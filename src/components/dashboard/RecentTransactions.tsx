'use client';

import { Transaction } from '@/lib/types';
import { formatVND } from '@/lib/format';
import { formatDate } from '@/lib/format';
import { SOURCE_LABELS } from '@/lib/constants';
import { Inbox, TrendingUp, TrendingDown } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  month: number;
  year: number;
  onViewAll: () => void;
  onEdit: (tx: Transaction) => void;
}

export function RecentTransactions({ transactions, month, year, onViewAll, onEdit }: RecentTransactionsProps) {
  const filtered = transactions
    .filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .slice(0, 3);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3" style={{ color: 'var(--muted-foreground)' }}>
        <Inbox size={15} />
        <span className="text-sm">Không có giao dịch trong tháng này</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        {filtered.map((tx, i) => (
          <button
            key={tx.id}
            onClick={() => onEdit(tx)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--muted)]"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: tx.type === 'income' ? 'var(--income-soft, #e6f4ea)' : 'var(--expense-soft, #fde8e8)' }}
            >
              {tx.type === 'income'
                ? <TrendingUp size={13} style={{ color: 'var(--income)' }} />
                : <TrendingDown size={13} style={{ color: 'var(--expense)' }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{tx.title}</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {SOURCE_LABELS[tx.source]} · {formatDate(tx.date)}
              </p>
            </div>
            <span
              className="text-sm font-semibold amount shrink-0"
              style={{ color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)' }}
            >
              {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={onViewAll}
        className="mt-2 text-sm font-medium transition-colors hover:opacity-70"
        style={{ color: 'var(--primary)' }}
      >
        Xem tất cả →
      </button>
    </div>
  );
}
