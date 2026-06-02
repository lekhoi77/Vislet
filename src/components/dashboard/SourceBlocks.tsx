'use client';

import { Transaction } from '@/lib/types';
import { formatVND } from '@/lib/format';
import { useAppStore } from '@/store/app-store';
import { PieChart as PieIcon, List } from 'lucide-react';
import { AppIcon } from '@/lib/icons';
import { BlockCardHeader } from '@/components/dashboard/BlockCardHeader';
import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PASTEL = [
  '#A8D8EA', '#FFD3B6', '#DCEDC1', '#D4A5F5',
  '#FFAAA5', '#B5EAD7', '#FFC8DD', '#C7CEEA',
];

interface SourceBlocksProps {
  transactions: Transaction[];
  title?: string;
  onAdd?: () => void;
  addLabel?: string;
}

export function SourceBlocks({ transactions, title, onAdd, addLabel = 'Thêm nguồn tiền' }: SourceBlocksProps) {
  const { customSources } = useAppStore();
  const [chartView, setChartView] = useState(false);

  const allSources = customSources.map(s => ({
    id: s.id,
    label: s.label,
    icon: <AppIcon name={s.icon} size={16} />,
  }));

  const getBalance = (sourceId: string) => {
    const inc = transactions.filter(t => t.source === sourceId && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.source === sourceId && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return inc - exp;
  };

  const chartData = allSources
    .map(s => ({ name: s.label, value: Math.max(0, getBalance(s.id)) }))
    .filter(d => d.value > 0);

  const hasData = chartData.length > 0;

  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>

      <BlockCardHeader title={title} onAdd={onAdd} addLabel={addLabel}>
        {([{ v: false, icon: <List size={12} />, label: 'Danh sách' }, { v: true, icon: <PieIcon size={12} />, label: 'Tỷ trọng' }] as const).map(opt => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => setChartView(opt.v)}
            className="view-toggle-btn flex flex-1 items-center justify-center gap-1 text-sm font-medium px-2 py-1 rounded-md min-w-0 md:flex-initial md:px-2.5"
            style={{
              background: chartView === opt.v ? 'var(--background)' : 'transparent',
              color: chartView === opt.v ? 'var(--foreground)' : 'var(--muted-foreground)',
              boxShadow: chartView === opt.v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </BlockCardHeader>

      {chartView ? (
        <div className="flex-1 flex items-center justify-center px-2 pb-3">
          {hasData ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={PASTEL[i % PASTEL.length]} stroke="none" />
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
        <div className="flex-1 overflow-y-auto max-h-[360px] md:max-h-none">
          {allSources.map((s, i) => {
            const balance = getBalance(s.id);
            return (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2.5"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <span className="shrink-0" style={{ color: 'var(--muted-foreground)' }}>{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
                  <p className="text-sm font-semibold amount leading-tight"
                    style={{ color: balance < 0 ? 'var(--down)' : 'var(--foreground)' }}>
                    {formatVND(balance)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
