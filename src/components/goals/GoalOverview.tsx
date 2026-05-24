'use client';

import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { formatVND, formatVNDShort } from '@/lib/format';
import { CATEGORY_LABELS, getCategoryColor } from '@/lib/constants';
import { useAppStore } from '@/store/app-store';
import { CategoryIcon } from '@/lib/icons';
import { PiggyBank, Plane, Clock, Tag, BarChart2, List, PieChart as PieIcon } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const BUILT_IN_ICONS: Record<string, React.ReactNode> = {
  saving: <PiggyBank size={16} />,
  travel: <Plane size={16} />,
  soon: <Clock size={16} />,
  none: <Tag size={16} />,
};

type ViewMode = 'list' | 'pie' | 'bars';

interface CategoryOverviewProps {
  transactions: Transaction[];
  month: number;
  year: number;
  onEdit: (tx: Transaction) => void;
}

export function CategoryOverview({ transactions, month, year }: CategoryOverviewProps) {
  const { customCategories } = useAppStore();
  const [view, setView] = useState<ViewMode>('list');

  const allCategories = [
    { id: 'saving', label: CATEGORY_LABELS['saving'] },
    { id: 'travel', label: CATEGORY_LABELS['travel'] },
    { id: 'soon', label: CATEGORY_LABELS['soon'] },
    { id: 'none', label: CATEGORY_LABELS['none'] },
    ...customCategories.map(c => ({ id: c.id, label: c.label })),
  ];

  const monthTxs = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const expenses = monthTxs.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

  const groups = allCategories
    .map((c) => {
      const txs = expenses.filter(t => t.category === c.id);
      const amount = txs.reduce((s, t) => s + t.amount, 0);
      const count = txs.length;
      const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return { ...c, amount, count, pct, color: getCategoryColor(c.id, customCategories) };
    })
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const incomeGroups = allCategories
    .map(c => {
      const txs = monthTxs.filter(t => t.type === 'income' && t.category === c.id);
      const amount = txs.reduce((s, t) => s + t.amount, 0);
      return { ...c, amount, count: txs.length };
    })
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // ── Bar data: 6 tháng gần nhất tính từ tháng đang xem
  const monthsBack = 6;
  const months: { m: number; y: number; label: string }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const dt = new Date(year, month - 1 - i, 1);
    months.push({
      m: dt.getMonth() + 1,
      y: dt.getFullYear(),
      label: `T${dt.getMonth() + 1}`,
    });
  }
  const barData = months.map(({ m, y, label }) => {
    const row: Record<string, string | number> = { label };
    allCategories.forEach(c => {
      row[c.label] = transactions
        .filter(t => {
          const d = new Date(t.date);
          return t.type === 'expense'
            && t.category === c.id
            && d.getMonth() + 1 === m
            && d.getFullYear() === y;
        })
        .reduce((s, t) => s + t.amount, 0);
    });
    return row;
  });
  const hasBars = barData.some(row =>
    allCategories.some(c => (row[c.label] as number) > 0)
  );

  if (expenses.length === 0 && monthTxs.length === 0 && view !== 'bars') {
    return (
      <EmptyState
        icon={BarChart2}
        title="Chưa có dữ liệu tháng này"
        subtitle="Thêm giao dịch và gắn danh mục để xem phân tích"
      />
    );
  }

  const getIcon = (id: string) => {
    if (BUILT_IN_ICONS[id]) return BUILT_IN_ICONS[id];
    const custom = customCategories.find(c => c.id === id);
    if (custom) return <CategoryIcon name={custom.icon} size={16} />;
    return <Tag size={16} />;
  };

  const viewOptions: { v: ViewMode; icon: React.ReactNode; label: string }[] = [
    { v: 'list', icon: <List size={13} />, label: 'Danh sách' },
    { v: 'pie',  icon: <PieIcon size={13} />, label: 'Tỉ trọng' },
    { v: 'bars', icon: <BarChart2 size={13} />, label: 'So sánh tháng' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Summary row */}
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

      {/* View toggle */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-overline">Chi tiêu theo danh mục</p>
        <div className="flex rounded-lg p-0.5 shrink-0" style={{ background: 'var(--muted)', gap: 2 }}>
          {viewOptions.map(opt => (
            <button key={opt.v} onClick={() => setView(opt.v)}
              className="view-toggle-btn flex items-center gap-1 text-sm font-medium px-2.5 py-1.5 rounded-md"
              style={{
                background: view === opt.v ? 'var(--background)' : 'transparent',
                color: view === opt.v ? 'var(--foreground)' : 'var(--muted-foreground)',
                boxShadow: view === opt.v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              {opt.icon}{opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* PIE view */}
      {view === 'pie' && groups.length > 0 && (
        <div className="rounded-2xl p-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={groups.map(g => ({ name: g.label, value: g.amount, id: g.id }))}
                cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                dataKey="value" paddingAngle={2}>
                {groups.map((g, i) => (
                  <Cell key={i} fill={g.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatVND(Number(v))}
                contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 13 }}
                itemStyle={{ fontWeight: 600 }}
              />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* BARS view */}
      {view === 'bars' && (
        <div className="rounded-2xl p-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          {hasBars ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => formatVNDShort(Number(v))} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  formatter={(v) => formatVND(Number(v))}
                  contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 12 }}
                  itemStyle={{ fontWeight: 600 }}
                  cursor={{ fill: 'var(--muted)' }}
                />
                <Legend iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(v) => <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{v}</span>} />
                {allCategories.map(c => (
                  <Bar key={c.id} dataKey={c.label} fill={getCategoryColor(c.id, customCategories)} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              Chưa có dữ liệu chi tiêu trong 6 tháng gần đây
            </p>
          )}
        </div>
      )}

      {/* LIST view */}
      {view === 'list' && (
        <>
          {/* Stacked proportion bar */}
          {groups.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                {groups.map(c => (
                  <div
                    key={c.id}
                    style={{ width: `${c.pct}%`, background: c.color, minWidth: c.pct > 0 ? 4 : 0 }}
                    title={`${c.label}: ${c.pct.toFixed(1)}%`}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {groups.map(c => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expense breakdown */}
          {groups.length > 0 && (
            <div className="flex flex-col rounded-2xl overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
              {groups.map((c, i) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
                        style={{ background: `${c.color}18`, color: c.color }}>
                        {getIcon(c.id)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{c.label}</p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{c.count} GD</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold amount" style={{ color: 'var(--expense)' }}>{formatVNDShort(c.amount)}</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{c.pct.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--muted)' }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${c.pct}%`, background: c.color, minWidth: c.pct > 0 ? 4 : 0 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Income by category (if any) */}
          {incomeGroups.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-overline">Thu nhập theo danh mục</p>
              <div className="flex flex-col rounded-2xl overflow-hidden"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                {incomeGroups.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2 px-4 py-3"
                    style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
                        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                        {getIcon(c.id)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{c.label}</p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{c.count} GD</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold amount" style={{ color: 'var(--income)' }}>{formatVNDShort(c.amount)}</p>
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
        </>
      )}
    </div>
  );
}

// Backward-compat alias
export const GoalOverview = CategoryOverview;
