'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActiveTab = 'overview' | 'transactions' | 'categories' | 'shared';

interface FABProps {
  activeTab: ActiveTab;
  onIncome: () => void;
  onExpense: () => void;
  onCreateShared: () => void;
  isFirstTime?: boolean;
}

export function FAB({ activeTab, onIncome, onExpense, onCreateShared, isFirstTime }: FABProps) {
  if (activeTab === 'shared') {
    return (
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 flex justify-center md:hidden"
        style={{ padding: '16px 20px 32px', zIndex: 40, maxWidth: 480, width: '100%' }}
      >
        <button
          id="fab-shared"
          onClick={onCreateShared}
          className={cn(
            'flex items-center gap-2 h-12 px-6 rounded-full font-semibold text-sm transition-all',
            isFirstTime && 'fab-hint'
          )}
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            boxShadow: 'var(--shadow-md)',
            border: 'none',
          }}
        >
          <Plus size={16} />
          Ghi chi chung
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 flex justify-center gap-3 md:hidden"
      style={{ padding: '16px 20px 32px', zIndex: 40, maxWidth: 480, width: '100%' }}
    >
      <button
        id="fab-income"
        onClick={onIncome}
        className={cn(
          'flex items-center gap-2 h-12 px-5 rounded-full font-semibold text-sm transition-all hover:bg-[var(--primary-soft)] active:scale-95',
          isFirstTime && 'fab-hint'
        )}
        style={{
          border: '1.5px solid var(--primary)',
          color: 'var(--primary)',
          background: 'white',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <Plus size={16} />
        Thu nhập
      </button>
      <button
        id="fab-expense"
        onClick={onExpense}
        className="flex items-center gap-2 h-12 px-5 rounded-full font-semibold text-sm transition-all hover:bg-[var(--orange-soft)] active:scale-95"
        style={{
          border: '1.5px solid var(--orange)',
          color: 'var(--orange)',
          background: 'white',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <Plus size={16} />
        Chi tiêu
      </button>
    </div>
  );
}
