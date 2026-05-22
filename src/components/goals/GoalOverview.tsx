'use client';

import { Transaction } from '@/lib/types';
import { formatVND, formatVNDShort } from '@/lib/format';
import { getGoalColor } from '@/lib/constants';
import { sortGoalsForDisplay } from '@/lib/catalog';
import { PROTECTED_GOAL_ID } from '@/lib/catalog-policy';
import { useAppStore } from '@/store/app-store';
import { BudgetIcon } from '@/lib/icons';
import { BarChart2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

interface GoalOverviewProps {
  transactions: Transaction[];
  month: number;
  year: number;
  onEdit: (tx: Transaction) => void;
}

export function GoalOverview({ transactions, month, year }: GoalOverviewProps) {
  const { customBudgets } = useAppStore();

  const allGoals = sortGoalsForDisplay(customBudgets).map(b => ({
    id: b.id,
    label: b.label,
    icon: b.icon,
  }));

  const monthTxs = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const expenses = monthTxs.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

  const groups = allGoals
    .map((g) => {
      const txs = expenses.filter(t => t.goal === g.id);
      const amount = txs.reduce((s, t) => s + t.amount, 0);
      const count = txs.length;
      const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return { ...g, amount, count, pct, color: getGoalColor(g.id, customBudgets) };
    })
    .filter(g => g.amount > 0 || g.id === PROTECTED_GOAL_ID)
    .sort((a, b) => {
      if (a.id === PROTECTED_GOAL_ID) return -1;
      if (b.id === PROTECTED_GOAL_ID) return 1;
      return b.amount - a.amount;
    });

  const incomeGroups = allGoals
    .map(g => {
      const txs = monthTxs.filter(t => t.type === 'income' && t.goal === g.id);
      const amount = txs.reduce((s, t) => s + t.amount, 0);
      return { ...g, amount, count: txs.length };
    })
    .filter(g => g.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (expenses.length === 0 && monthTxs.length === 0) {
    return (
      <EmptyState
        icon={BarChart2}
        title="Chưa có dữ liệu tháng này"
        subtitle="Thêm giao dịch và gắn danh mục để xem phân tích"
      />
    );
  }

  const getIcon = (id: string, iconName: string) => (
    <BudgetIcon name={iconName} size={16} />
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5 p-4 rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Tổng chi</span>
          <p className="text-lg font-bold amount" style={{ color: 'var(--expense)' }}>{formatVND(totalExpense)}</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{expenses.length} giao dịch</p>
        </div>
        <div className="flex flex-col gap-0.5 p-4 rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Danh mục lớn nhất</span>
          {groups[0] ? (
            <>
              <p className="text-sm font-bold leading-snug" style={{ color: 'var(--foreground)' }}>{groups[0].label}</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{groups[0].pct.toFixed(0)}% tổng chi</p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</p>
          )}
        </div>
      </div>

      {groups.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {groups.map(g => (
              <div
                key={g.id}
                style={{
                  width: `${g.pct}%`,
                  background: g.color,
                  minWidth: g.pct > 0 || g.id === PROTECTED_GOAL_ID ? 4 : 0,
                }}
                title={`${g.label}: ${g.pct.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {groups.map(g => (
              <div key={g.id} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: g.color }} />
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{g.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {groups.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-overline">Chi tiêu theo danh mục</p>
          <div className="flex flex-col rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            {groups.map((g, i) => (
              <div
                key={g.id}
                className="flex flex-col gap-2 px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
                      style={{ background: `${g.color}18`, color: g.color }}>
                      {getIcon(g.id, g.icon)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{g.label}</p>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{g.count} GD</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold amount" style={{ color: 'var(--expense)' }}>{formatVNDShort(g.amount)}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{g.pct.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--muted)' }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${g.pct}%`,
                      background: g.color,
                      minWidth: g.pct > 0 || g.id === PROTECTED_GOAL_ID ? 4 : 0,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {incomeGroups.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-overline">Thu nhập theo danh mục</p>
          <div className="flex flex-col rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            {incomeGroups.map((g, i) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-2 px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                    {getIcon(g.id, g.icon)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{g.label}</p>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{g.count} GD</p>
                  </div>
                </div>
                <p className="text-sm font-bold amount" style={{ color: 'var(--income)' }}>{formatVNDShort(g.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 && (
        <EmptyState
          icon={BarChart2}
          title="Chưa có chi tiêu tháng này"
          subtitle="Thêm giao dịch chi tiêu và gắn danh mục để xem phân tích"
        />
      )}
    </div>
  );
}
