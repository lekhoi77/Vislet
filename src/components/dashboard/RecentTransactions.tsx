'use client';

import { Transaction } from '@/lib/types';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { Separator } from '@/components/ui/separator';
import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

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
    .slice(0, 5);

  return (
    <div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Không có giao dịch trong tháng này"
        />
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          {filtered.map((tx, i) => (
            <div key={tx.id}>
              {i > 0 && <Separator />}
              <TransactionItem tx={tx} onEdit={onEdit} />
            </div>
          ))}
        </div>
      )}
      {transactions.length > 0 && (
        <button
          onClick={onViewAll}
          className="mt-3 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--primary)' }}
        >
          Xem tất cả →
        </button>
      )}
    </div>
  );
}
