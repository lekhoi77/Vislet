'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TabValue = 'overview' | 'transactions' | 'categories' | 'debts';

interface TabNavProps {
  value: TabValue;
  onChange: (v: TabValue) => void;
}

const TABS: { value: TabValue; label: string }[] = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'transactions', label: 'Giao dịch' },
  { value: 'categories', label: 'Danh mục' },
  { value: 'debts', label: 'Nợ' },
];

export function TabNav({ value, onChange }: TabNavProps) {
  return (
    <div
      className="sticky z-40 md:hidden"
      style={{
        top: 56,
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <Tabs value={value} onValueChange={v => onChange(v as TabValue)}>
        <TabsList
          className="w-full h-auto bg-transparent rounded-none p-0 justify-start overflow-x-auto"
          style={{ gap: 0 }}
        >
          {TABS.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              id={`tab-${tab.value}`}
              className="relative flex-1 h-11 rounded-none bg-transparent text-sm font-medium border-0 shadow-none px-4
                data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent
                after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full
                data-[state=active]:after:bg-[var(--primary)]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <span className="data-[state=active]:text-[var(--foreground)]">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
