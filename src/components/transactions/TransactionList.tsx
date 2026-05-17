'use client';

import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { TransactionItem } from './TransactionItem';
import { TransactionItemSkeleton } from './TransactionItemSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Receipt } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PAGE_SIZE } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onEdit: (tx: Transaction) => void;
  maxItems?: number;
  showLoadMore?: boolean;
}

export function TransactionList({ transactions, isLoading, onEdit, maxItems, showLoadMore }: TransactionListProps) {
  const [page, setPage] = useState(1);

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <TransactionItemSkeleton />
            {i < 2 && <Separator className="mx-4" />}
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Chưa có giao dịch nào"
        subtitle="Nhấn + để thêm giao dịch đầu tiên"
      />
    );
  }

  const limit = maxItems ?? page * PAGE_SIZE;
  const visible = transactions.slice(0, limit);
  const hasMore = showLoadMore && transactions.length > limit;

  return (
    <div className="flex flex-col">
      {visible.map((tx, i) => (
        <div key={tx.id}>
          <TransactionItem tx={tx} onEdit={onEdit} />
          {i < visible.length - 1 && <Separator className="mx-4" />}
        </div>
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm"
            style={{ color: 'var(--primary)' }}
            onClick={() => setPage(p => p + 1)}
          >
            Xem thêm
          </Button>
        </div>
      )}
    </div>
  );
}
