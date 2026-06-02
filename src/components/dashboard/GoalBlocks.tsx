'use client';

import { Transaction } from '@/lib/types';
import { formatVND, formatVNDShort } from '@/lib/format';
import { getCategoryColor } from '@/lib/constants';
import { useAppStore } from '@/store/app-store';
import { CategoryIcon } from '@/lib/icons';
import { Separator } from '@/components/ui/separator';
import { BarChart2, List, PieChart as PieIcon } from 'lucide-react';
import { BlockCardHeader } from '@/components/dashboard/BlockCardHeader';
import { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';


type ViewMode = 'list' | 'pie' | 'bars';

interface CategoryBlocksProps {
  transactions: Transaction[];
  /** Tháng hiện đang xem (1–12) */
  month: number;
  year: number;
  title?: string;
  onAdd?: () => void;
  addLabel?: string;
}

export function CategoryBlocks({ transactions, month, year, title, onAdd, addLabel = 'Thêm danh mục' }: CategoryBlocksProps) {
  const { customCategories } = useAppStore();
  const [view, setView] = useState<ViewMode>('list');

  const allCategories = customCategories
    .filter(c => c.id !== 'none')
    .map(c => ({
      id: c.id,
      label: c.label,
      icon: <CategoryIcon name={c.icon} size={16} />,
    }));

  // ── Reset hàng tháng: chỉ tính chi tiêu trong tháng đang xem ─
  const monthTxs = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const getSpent = (categoryId: string) => {
    return monthTxs
      .filter(t => t.category === categoryId && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  };

  const balances = allCategories.map(c => ({ ...c, balance: getSpent(c.id), color: getCategoryColor(c.id, customCategories) }));
  const total = balances.reduce((s, c) => s + c.balance, 0);

  // ── Pie data
  const pieData = balances
    .map(c => ({ name: c.label, value: c.balance }))
    .filter(d => d.value > 0);
  const hasPie = pieData.length > 0;

  // ── Bar data: 6 tháng gần nhất tính từ tháng hiện đang xem
  const monthsBack = 6;
  const months: { m: number; y: number; key: string; label: string }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const dt = new Date(year, month - 1 - i, 1);
    months.push({
      m: dt.getMonth() + 1,
      y: dt.getFullYear(),
      key: `${dt.getFullYear()}-${dt.getMonth() + 1}`,
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

  const viewOptions: { v: ViewMode; icon: React.ReactNode; label: string }[] = [
    { v: 'list', icon: <List size={12} />, label: 'Danh sách' },
    { v: 'pie',  icon: <PieIcon size={12} />, label: 'Tỉ trọng' },
    { v: 'bars', icon: <BarChart2 size={12} />, label: 'So sánh' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>

      <BlockCardHeader title={title} onAdd={onAdd} addLabel={addLabel}>
        {viewOptions.map(opt => (
          <button
            key={opt.v}
            type="button"
            onClick={() => setView(opt.v)}
            className="view-toggle-btn flex flex-1 items-center justify-center gap-1 text-sm font-medium px-1.5 py-1 rounded-md min-w-0 md:flex-initial md:px-2.5"
            style={{
              background: view === opt.v ? 'var(--background)' : 'transparent',
              color: view === opt.v ? 'var(--foreground)' : 'var(--muted-foreground)',
              boxShadow: view === opt.v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </BlockCardHeader>

      {view === 'pie' && (
        <div className="flex-1 flex items-center justify-center px-2 pb-3">
          {hasPie ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={getCategoryColor(balances.find(b => b.label === entry.name)?.id ?? '', customCategories)} stroke="none" />
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
      )}

      {view === 'bars' && (
        <BarsView
          hasBars={hasBars}
          barData={barData}
          allCategories={allCategories}
          customCategories={customCategories}
        />
      )}

      {view === 'list' && (
        <div className="flex-1 overflow-y-auto max-h-[360px] md:max-h-none">
          {balances.map((c, i) => {
            const pct = total > 0 ? (c.balance / total) * 100 : 0;
            return (
              <div key={c.id}>
                {i > 0 && <Separator />}
                <div className="flex flex-col gap-1.5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                        style={{ background: `${c.color}20`, color: c.color }}>
                        {c.icon}
                      </div>
                      <p className="text-sm font-medium leading-tight" style={{ color: 'var(--foreground)' }}>{c.label}</p>
                    </div>
                    <p className="text-sm font-semibold amount shrink-0 ml-2" style={{ color: 'var(--foreground)' }}>
                      {formatVND(c.balance)}
                    </p>
                  </div>
                  <div className="w-full h-1 rounded-full" style={{ background: 'var(--muted)' }}>
                    <div className="h-1 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: c.color, minWidth: pct > 0 ? 4 : 0 }} />
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

// Backward-compat alias
export const GoalBlocks = CategoryBlocks;

// ─────────────────────────────────────────────────────────────
// BarsView — chart "So sánh" + custom legend với hover tooltip
// ─────────────────────────────────────────────────────────────

interface BarsViewProps {
  hasBars: boolean;
  barData: Record<string, string | number>[];
  allCategories: { id: string; label: string; icon: React.ReactNode }[];
  customCategories: import('@/lib/types').CustomCategory[];
}

function BarsView({ hasBars, barData, allCategories, customCategories }: BarsViewProps) {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  if (!hasBars) {
    return (
      <div className="flex-1 flex items-center justify-center px-2 pb-3 min-h-0">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Chưa có dữ liệu các tháng gần đây</p>
      </div>
    );
  }

  const hoveredEntry = hoveredCat ? allCategories.find(c => c.id === hoveredCat) : null;
  const hoveredColor = hoveredCat ? getCategoryColor(hoveredCat, customCategories) : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-2 pb-3 min-h-0 relative">
      {/* Chart centered vertically inside the block */}
      <div className="w-full" style={{ maxWidth: 560 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => formatVNDShort(Number(v))} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              formatter={(v) => formatVND(Number(v))}
              contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 12 }}
              itemStyle={{ fontWeight: 600 }}
              cursor={{ fill: 'var(--muted)' }}
            />
            {allCategories.map(c => {
              const color = getCategoryColor(c.id, customCategories);
              const isDim = hoveredCat && hoveredCat !== c.id;
              return (
                <Bar
                  key={c.id}
                  dataKey={c.label}
                  fill={color}
                  fillOpacity={isDim ? 0.25 : 1}
                  radius={[4, 4, 0, 0]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend — hover hiện breakdown của category đó qua các tháng */}
      <div className="w-full mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-2 relative">
        {allCategories.map(c => {
          const color = getCategoryColor(c.id, customCategories);
          const isActive = hoveredCat === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onMouseEnter={() => setHoveredCat(c.id)}
              onMouseLeave={() => setHoveredCat(null)}
              onClick={() => setHoveredCat(prev => prev === c.id ? null : c.id)}
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md transition-colors"
              style={{
                background: isActive ? 'var(--muted)' : 'transparent',
                opacity: hoveredCat && !isActive ? 0.5 : 1,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{c.label}</span>
            </button>
          );
        })}

        {/* Floating breakdown popup */}
        {hoveredEntry && hoveredColor && (
          <div
            className="absolute z-10 rounded-xl px-3 py-2 pointer-events-none"
            style={{
              bottom: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-float)',
              minWidth: 180,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5 pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: hoveredColor }} />
              <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{hoveredEntry.label}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {barData.map(row => {
                const v = Number(row[hoveredEntry.label] ?? 0);
                return (
                  <div key={String(row.label)} className="flex items-center justify-between gap-3 text-xs">
                    <span style={{ color: 'var(--muted-foreground)' }}>{String(row.label)}</span>
                    <span className="font-semibold tabular-nums" style={{ color: v > 0 ? hoveredColor : 'var(--muted-foreground)' }}>
                      {v > 0 ? formatVND(v) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
