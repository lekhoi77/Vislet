'use client';

import { Transaction } from '@/lib/types';
import { formatVND } from '@/lib/format';
import { GOAL_LABELS, getGoalColor } from '@/lib/constants';
import { useAppStore } from '@/store/app-store';
import { BudgetIcon } from '@/lib/icons';
import { Separator } from '@/components/ui/separator';
import { PiggyBank, Plane, Clock, BarChart2, List, Plus } from 'lucide-react';
import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BUILT_IN_GOALS = [
  { id: 'saving', label: GOAL_LABELS['saving'], icon: <PiggyBank size={16} /> },
  { id: 'travel', label: GOAL_LABELS['travel'], icon: <Plane size={16} /> },
  { id: 'soon',   label: GOAL_LABELS['soon'],   icon: <Clock size={16} /> },
];

interface GoalBlocksProps {
  transactions: Transaction[];
  title?: string;
  onAdd?: () => void;
  addLabel?: string;
}

export function GoalBlocks({ transactions, title, onAdd, addLabel = 'Thêm mục tiêu' }: GoalBlocksProps) {
  const { customBudgets } = useAppStore();
  const [chartView, setChartView] = useState(false);

  const allGoals = [
    ...BUILT_IN_GOALS,
    ...customBudgets.map(b => ({
      id: b.id,
      label: b.label,
      icon: <BudgetIcon name={b.icon} size={16} />,
    })),
  ];

  // Mỗi goal hiển thị TỔNG CHI TIÊU đã gắn vào (vì form chỉ gán goal cho expense)
  const getSpent = (goalId: string) => {
    return transactions
      .filter(t => t.goal === goalId && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  };

  const balances = allGoals.map(g => ({ ...g, balance: getSpent(g.id), color: getGoalColor(g.id, customBudgets) }));
  const total = balances.reduce((s, g) => s + g.balance, 0);

  const chartData = balances
    .map(g => ({ name: g.label, value: g.balance }))
    .filter(d => d.value > 0);

  const hasData = chartData.length > 0;

  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>

      {/* Header: title + add + toggle */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {title && (
            <p className="text-overline truncate">{title}</p>
          )}
          {onAdd && (
            <button onClick={onAdd} aria-label={addLabel} className="add-btn-expand">
              <Plus size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <span className="add-btn-label">{addLabel}</span>
            </button>
          )}
        </div>
        <div className="flex rounded-lg p-0.5 shrink-0" style={{ background: 'var(--muted)', gap: 2 }}>
          {([{ v: false, icon: <List size={12} />, label: 'Danh sách' }, { v: true, icon: <BarChart2 size={12} />, label: 'Biểu đồ' }] as const).map(opt => (
            <button key={String(opt.v)} onClick={() => setChartView(opt.v)}
              className="view-toggle-btn flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-md"
              style={{
                background: chartView === opt.v ? 'var(--background)' : 'transparent',
                color: chartView === opt.v ? 'var(--foreground)' : 'var(--muted-foreground)',
                boxShadow: chartView === opt.v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              {opt.icon}{opt.label}
            </button>
          ))}
        </div>
      </div>

      {chartView ? (
        <div className="flex-1 flex items-center justify-center px-2 pb-3">
          {hasData ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={getGoalColor(balances.find(b => b.label === entry.name)?.id ?? '', customBudgets)} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatVND(Number(v))}
                  contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 14 }}
                  itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                  labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Chưa có dữ liệu</p>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {balances.map((g, i) => {
            const pct = total > 0 ? (g.balance / total) * 100 : 0;
            return (
              <div key={g.id}>
                {i > 0 && <Separator />}
                <div className="flex flex-col gap-1.5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                        style={{ background: `${g.color}20`, color: g.color }}>
                        {g.icon}
                      </div>
                      <p className="text-sm font-medium leading-tight" style={{ color: 'var(--foreground)' }}>{g.label}</p>
                    </div>
                    <p className="text-sm font-semibold amount shrink-0 ml-2" style={{ color: 'var(--foreground)' }}>
                      {formatVND(g.balance)}
                    </p>
                  </div>
                  <div className="w-full h-1 rounded-full" style={{ background: 'var(--muted)' }}>
                    <div className="h-1 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: g.color, minWidth: pct > 0 ? 4 : 0 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
