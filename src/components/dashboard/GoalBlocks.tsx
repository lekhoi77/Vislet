'use client';

import { Transaction } from '@/lib/types';
import { formatVND } from '@/lib/format';
import { GOAL_LABELS } from '@/lib/constants';
import { useAppStore } from '@/store/app-store';
import { BudgetIcon } from '@/lib/icons';
import { Separator } from '@/components/ui/separator';
import { PiggyBank, Plane, Clock } from 'lucide-react';

const BUILT_IN_GOALS = [
  { id: 'saving', label: GOAL_LABELS['saving'], icon: <PiggyBank size={16} /> },
  { id: 'travel', label: GOAL_LABELS['travel'], icon: <Plane size={16} /> },
  { id: 'soon',   label: GOAL_LABELS['soon'],   icon: <Clock size={16} /> },
];

interface GoalBlocksProps {
  transactions: Transaction[];
}

export function GoalBlocks({ transactions }: GoalBlocksProps) {
  const { customBudgets } = useAppStore();

  const allGoals = [
    ...BUILT_IN_GOALS,
    ...customBudgets.map(b => ({
      id: b.id,
      label: b.label,
      icon: <BudgetIcon name={b.icon} size={16} />,
    })),
  ];

  const getBalance = (goalId: string) => {
    const inc = transactions.filter(t => t.goal === goalId && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.goal === goalId && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return Math.max(0, inc - exp);
  };

  const balances = allGoals.map(g => ({ ...g, balance: getBalance(g.id) }));
  const total = balances.reduce((s, g) => s + g.balance, 0);

  return (
    <div
      className="rounded-2xl overflow-y-auto h-full"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {balances.map((g, i) => {
        const pct = total > 0 ? (g.balance / total) * 100 : 0;
        return (
          <div key={g.id}>
            {i > 0 && <Separator />}
            <div className="flex flex-col gap-1.5 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  >
                    {g.icon}
                  </div>
                  <p className="text-sm font-medium leading-tight" style={{ color: 'var(--foreground)' }}>{g.label}</p>
                </div>
                <p className="text-sm font-semibold amount shrink-0 ml-2" style={{ color: 'var(--foreground)' }}>
                  {formatVND(g.balance)}
                </p>
              </div>
              <div className="w-full h-1 rounded-full" style={{ background: 'var(--muted)' }}>
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: 'var(--primary)', minWidth: pct > 0 ? 4 : 0 }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
