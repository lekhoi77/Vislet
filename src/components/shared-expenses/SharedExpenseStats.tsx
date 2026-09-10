'use client';

import { SharedExpense } from '@/lib/types';
import { formatVND } from '@/lib/format';

interface SharedExpenseStatsProps {
  sharedExpenses: SharedExpense[];
  currentUserId: string;
}

const OPEN_STATUSES: SharedExpense['status'][] = ['pending', 'active', 'pending_confirm'];

export function SharedExpenseStats({ sharedExpenses, currentUserId }: SharedExpenseStatsProps) {
  const totalIOwe = sharedExpenses
    .filter(e => e.participantUserId === currentUserId && OPEN_STATUSES.includes(e.status))
    .reduce((s, e) => s + e.remainingAmount, 0);
  const totalTheyOwe = sharedExpenses
    .filter(e => e.ownerUserId === currentUserId && OPEN_STATUSES.includes(e.status))
    .reduce((s, e) => s + e.remainingAmount, 0);
  const totalSettled = sharedExpenses
    .filter(e => e.status === 'settled')
    .reduce((s, e) => s + e.splitAmount, 0);

  const stats = [
    { label: 'Tôi cần trả', value: totalIOwe, color: 'var(--down)' },
    { label: 'Họ cần trả tôi', value: totalTheyOwe, color: 'var(--income)' },
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
