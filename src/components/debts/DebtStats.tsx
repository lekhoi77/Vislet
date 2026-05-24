'use client';

import { SharedDebt } from '@/lib/types';
import { formatVND } from '@/lib/format';

interface DebtStatsProps {
  sharedDebts: SharedDebt[];
  currentUserId: string;
}

const OPEN_STATUSES: SharedDebt['status'][] = ['pending', 'active', 'pending_confirm'];

export function DebtStats({ sharedDebts, currentUserId }: DebtStatsProps) {
  const totalOwe = sharedDebts
    .filter(d => d.debtorUserId === currentUserId && OPEN_STATUSES.includes(d.status))
    .reduce((s, d) => s + d.remainingAmount, 0);
  const totalLend = sharedDebts
    .filter(d => d.creditorUserId === currentUserId && OPEN_STATUSES.includes(d.status))
    .reduce((s, d) => s + d.remainingAmount, 0);
  const totalSettled = sharedDebts
    .filter(d => d.status === 'settled')
    .reduce((s, d) => s + d.debtAmount, 0);

  const stats = [
    { label: 'Tôi đang nợ', value: totalOwe, color: 'var(--down)' },
    { label: 'Họ nợ tôi', value: totalLend, color: 'var(--income)' },
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
