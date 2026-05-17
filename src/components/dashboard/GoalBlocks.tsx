'use client';

import { Transaction, TransactionGoal } from '@/lib/types';
import { formatVND } from '@/lib/format';
import { GOAL_LABELS, GOAL_DESCRIPTIONS } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { PiggyBank, Plane, Clock } from 'lucide-react';

const GOALS: { value: TransactionGoal; icon: React.ReactNode; label: string; desc: string }[] = [
  { value: 'saving', icon: <PiggyBank size={18} />, label: GOAL_LABELS['saving'], desc: GOAL_DESCRIPTIONS['saving'] },
  { value: 'travel', icon: <Plane size={18} />, label: GOAL_LABELS['travel'], desc: GOAL_DESCRIPTIONS['travel'] },
  { value: 'soon', icon: <Clock size={18} />, label: GOAL_LABELS['soon'], desc: GOAL_DESCRIPTIONS['soon'] },
];

interface GoalBlocksProps {
  transactions: Transaction[];
}

export function GoalBlocks({ transactions }: GoalBlocksProps) {
  const getBalance = (goal: TransactionGoal) => {
    const inc = transactions.filter(t => t.goal === goal && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.goal === goal && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return Math.max(0, inc - exp);
  };

  const balances = GOALS.map(g => ({ ...g, balance: getBalance(g.value) }));
  const total = balances.reduce((s, g) => s + g.balance, 0);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {balances.map((g, i) => {
        const pct = total > 0 ? (g.balance / total) * 100 : 0;
        return (
          <div key={g.value}>
            {i > 0 && <Separator />}
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  >
                    {g.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{g.label}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{g.desc}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold amount" style={{ color: 'var(--foreground)' }}>
                  {formatVND(g.balance)}
                </p>
              </div>
              <div
                className="w-full h-1 rounded-full"
                style={{ background: 'var(--muted)' }}
              >
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: 'var(--primary)',
                    minWidth: pct > 0 ? 4 : 0,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
