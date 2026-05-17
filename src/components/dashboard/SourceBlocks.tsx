'use client';

import { Transaction, TransactionSource } from '@/lib/types';
import { formatVND } from '@/lib/format';
import { SOURCE_LABELS } from '@/lib/constants';
import { Building2, Wallet, Smartphone } from 'lucide-react';

const SOURCES: { value: TransactionSource; icon: React.ReactNode }[] = [
  { value: 'bank', icon: <Building2 size={22} /> },
  { value: 'cash', icon: <Wallet size={22} /> },
  { value: 'momo', icon: <Smartphone size={22} /> },
];

interface SourceBlocksProps {
  transactions: Transaction[];
}

export function SourceBlocks({ transactions }: SourceBlocksProps) {
  const getBalance = (source: TransactionSource) => {
    const inc = transactions.filter(t => t.source === source && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.source === source && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return Math.max(0, inc - exp);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {SOURCES.map(s => (
        <div
          key={s.value}
          className="flex flex-col items-center gap-2 p-4 rounded-xl"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            textAlign: 'center',
          }}
        >
          <div style={{ color: 'var(--muted-foreground)' }}>{s.icon}</div>
          <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            {SOURCE_LABELS[s.value]}
          </p>
          <p className="text-sm font-semibold amount" style={{ color: 'var(--foreground)' }}>
            {formatVND(getBalance(s.value))}
          </p>
        </div>
      ))}
    </div>
  );
}
