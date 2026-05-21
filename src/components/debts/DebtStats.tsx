'use client';

import { Debt } from '@/lib/types';
import { formatVND } from '@/lib/format';

interface DebtStatsProps {
  debts: Debt[];
}

export function DebtStats({ debts }: DebtStatsProps) {
  const totalOwe = debts.filter(d => d.type === 'owe' && !d.settled).reduce((s, d) => s + d.amount, 0);
  const totalLend = debts.filter(d => d.type === 'lend' && !d.settled).reduce((s, d) => s + d.amount, 0);
  const totalSettled = debts.filter(d => d.settled).reduce((s, d) => s + d.amount, 0);

  const stats = [
    { label: 'Đang nợ', value: totalOwe, color: 'var(--expense)' },
    { label: 'Cho vay', value: totalLend, color: 'var(--income)' },
    { label: 'Đã xử lý', value: totalSettled, color: 'var(--muted-foreground)' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(s => (
        <div
          key={s.label}
          className="flex flex-col gap-1 p-4 rounded-xl"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
          <p className="text-sm font-bold amount" style={{ color: s.color }}>
            {formatVND(s.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
