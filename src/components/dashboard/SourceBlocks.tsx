'use client';

import { Transaction } from '@/lib/types';
import { formatVND } from '@/lib/format';
import { SOURCE_LABELS } from '@/lib/constants';
import { useAppStore } from '@/store/app-store';
import { Building2, Wallet, Smartphone, CircleDot } from 'lucide-react';

const BUILT_IN_ICONS: Record<string, React.ReactNode> = {
  bank:  <Building2 size={16} />,
  cash:  <Wallet size={16} />,
  momo:  <Smartphone size={16} />,
};

interface SourceBlocksProps {
  transactions: Transaction[];
}

export function SourceBlocks({ transactions }: SourceBlocksProps) {
  const { customSources } = useAppStore();

  const allSources = [
    { id: 'bank',  label: SOURCE_LABELS.bank,  icon: BUILT_IN_ICONS.bank },
    { id: 'cash',  label: SOURCE_LABELS.cash,  icon: BUILT_IN_ICONS.cash },
    { id: 'momo',  label: SOURCE_LABELS.momo,  icon: BUILT_IN_ICONS.momo },
    ...customSources.map(s => ({
      id: s.id,
      label: s.label,
      icon: <CircleDot size={16} />,
    })),
  ];

  const getBalance = (sourceId: string) => {
    const inc = transactions.filter(t => t.source === sourceId && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.source === sourceId && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return inc - exp;
  };

  return (
    <div
      className="rounded-2xl overflow-y-auto h-full"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {allSources.map((s, i) => {
        const balance = getBalance(s.id);
        return (
          <div
            key={s.id}
            className="flex items-center gap-2 px-3 py-2.5"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
          >
            <span className="shrink-0" style={{ color: 'var(--muted-foreground)' }}>{s.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
              <p className="text-sm font-semibold amount leading-tight" style={{ color: balance < 0 ? 'var(--expense)' : 'var(--foreground)' }}>
                {formatVND(balance)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
