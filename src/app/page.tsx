'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Header } from '@/components/layout/Header';
import { TabNav } from '@/components/layout/TabNav';
import { FAB } from '@/components/layout/FAB';
import { OnboardingScreen } from '@/components/profile/OnboardingScreen';
import { AddProfileSheet } from '@/components/profile/AddProfileSheet';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { DebtForm } from '@/components/debts/DebtForm';
import { DebtCard } from '@/components/debts/DebtCard';
import { DebtStats } from '@/components/debts/DebtStats';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { SourceBlocks } from '@/components/dashboard/SourceBlocks';
import { GoalBlocks } from '@/components/dashboard/GoalBlocks';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { GoalOverview } from '@/components/goals/GoalOverview';
import { Transaction, Debt, TransactionType } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/shared/EmptyState';
import { Handshake, LayoutDashboard, ArrowLeftRight, Target, Plus } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

type ActiveTab = 'overview' | 'transactions' | 'goals' | 'debts';
type DebtFilter = 'open' | 'settled';

export default function HomePage() {
  const { initApp, isLoaded, profiles, transactions, debts } = useAppStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);

  // Transaction form state
  const [txFormOpen, setTxFormOpen] = useState(false);
  const [txFormType, setTxFormType] = useState<TransactionType>('income');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Debt form state
  const [debtFormOpen, setDebtFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Month filter
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Debt filter tab
  const [debtFilter, setDebtFilter] = useState<DebtFilter>('open');

  // Page content transition
  const [contentKey, setContentKey] = useState(0);

  // First time hint for FAB
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    initApp();
  }, [initApp]);

  useEffect(() => {
    if (isLoaded) {
      if (profiles.length === 0) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
        if (transactions.length === 0) {
          setIsFirstTime(true);
          setTimeout(() => setIsFirstTime(false), 4000);
        }
      }
    }
  }, [isLoaded, profiles.length, transactions.length]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setContentKey(k => k + 1);
    window.scrollTo({ top: 0 });
  };

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setContentKey(k => k + 1);
  };

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setContentKey(k => k + 1);
  };

  const handleOpenIncomForm = useCallback(() => {
    setEditingTx(null);
    setTxFormType('income');
    setTxFormOpen(true);
  }, []);

  const handleOpenExpenseForm = useCallback(() => {
    setEditingTx(null);
    setTxFormType('expense');
    setTxFormOpen(true);
  }, []);

  const handleEditTx = useCallback((tx: Transaction) => {
    setEditingTx(tx);
    setTxFormType(tx.type);
    setTxFormOpen(true);
  }, []);

  const handleEditDebt = useCallback((debt: Debt) => {
    setEditingDebt(debt);
    setDebtFormOpen(true);
  }, []);

  const filteredDebts = debts.filter(d => debtFilter === 'open' ? !d.settled : d.settled);
  const monthTxs = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  if (!isLoaded) {
    return (
      <div className="app-container flex items-center justify-center min-h-dvh">
        <div className="flex flex-col items-center gap-3">
          <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>ví.app</p>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full skeleton-animate" style={{ background: 'var(--primary)', animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="app-container">
        <OnboardingScreen onDone={() => setShowOnboarding(false)} />
      </div>
    );
  }

  const DESKTOP_TABS = [
    { value: 'overview' as ActiveTab, label: 'Tổng quan', icon: LayoutDashboard },
    { value: 'transactions' as ActiveTab, label: 'Giao dịch', icon: ArrowLeftRight },
    { value: 'goals' as ActiveTab, label: 'Mục tiêu', icon: Target },
    { value: 'debts' as ActiveTab, label: 'Nợ', icon: Handshake },
  ];

  return (
    <div className="app-container">
      <Header onAddProfile={() => setShowAddProfile(true)} />

      <div className="md:flex" style={{ minHeight: 'calc(100dvh - 56px)' }}>
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex flex-col w-56 shrink-0 sticky overflow-y-auto"
          style={{
            top: 56,
            height: 'calc(100dvh - 56px)',
            background: 'var(--background)',
            borderRight: '1px solid var(--border)',
          }}
        >
          <nav className="flex flex-col gap-1 p-3 flex-1">
            {DESKTOP_TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleTabChange(value)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left"
                style={{
                  background: activeTab === value ? 'var(--accent)' : 'transparent',
                  color: activeTab === value ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
          <div className="p-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
            {activeTab === 'debts' ? (
              <button
                onClick={() => { setEditingDebt(null); setDebtFormOpen(true); }}
                className="flex items-center gap-2 h-10 px-4 rounded-xl font-semibold text-sm w-full justify-center transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <Plus size={15} /> Ghi nợ
              </button>
            ) : (
              <>
                <button
                  onClick={handleOpenIncomForm}
                  className="flex items-center gap-2 h-10 px-4 rounded-xl font-semibold text-sm w-full justify-center transition-all hover:bg-[var(--primary-soft)] active:scale-95"
                  style={{ border: '1.5px solid var(--primary)', color: 'var(--primary)', background: 'transparent' }}
                >
                  <Plus size={15} /> Thu nhập
                </button>
                <button
                  onClick={handleOpenExpenseForm}
                  className="flex items-center gap-2 h-10 px-4 rounded-xl font-semibold text-sm w-full justify-center transition-all hover:bg-[var(--muted)] active:scale-95"
                  style={{ border: '1.5px solid var(--border)', color: 'var(--foreground)', background: 'transparent' }}
                >
                  <Plus size={15} /> Chi tiêu
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <TabNav value={activeTab} onChange={handleTabChange} />

          <main className="pb-[120px] md:pb-10">
        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div key={`overview-${contentKey}`} className="page-appear flex flex-col gap-7 p-5 pt-5">
            <div className="flex items-center">
              <MonthSelector month={month} year={year} onPrev={handlePrevMonth} onNext={handleNextMonth} />
            </div>
            <SummaryCards transactions={transactions} month={month} year={year} />
            <div>
              <p className="text-overline mb-4">Nguồn tiền</p>
              <SourceBlocks transactions={transactions} />
            </div>
            <div>
              <p className="text-overline mb-4">Quỹ mục tiêu</p>
              <GoalBlocks transactions={transactions} />
            </div>
            <div>
              <p className="text-overline mb-4">Giao dịch gần đây</p>
              <RecentTransactions
                transactions={transactions}
                month={month}
                year={year}
                onViewAll={() => handleTabChange('transactions')}
                onEdit={handleEditTx}
              />
            </div>
          </div>
        )}

        {/* ─── TRANSACTIONS TAB ─── */}
        {activeTab === 'transactions' && (
          <div key={`tx-${contentKey}`} className="page-appear flex flex-col gap-5 pt-5">
            <div className="flex items-center justify-between px-5">
              <p className="text-overline">Lịch sử giao dịch</p>
              <MonthSelector month={month} year={year} onPrev={handlePrevMonth} onNext={handleNextMonth} />
            </div>
            <div
              className="mx-5 rounded-2xl overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', minHeight: 80 }}
            >
              <TransactionList
                transactions={monthTxs}
                onEdit={handleEditTx}
                showLoadMore
              />
            </div>
          </div>
        )}

        {/* ─── GOALS TAB ─── */}
        {activeTab === 'goals' && (
          <div key={`goals-${contentKey}`} className="page-appear p-5 pt-5">
            <GoalOverview transactions={transactions} onEdit={handleEditTx} />
          </div>
        )}

        {/* ─── DEBTS TAB ─── */}
        {activeTab === 'debts' && (
          <div key={`debts-${contentKey}`} className="page-appear flex flex-col gap-5 p-5 pt-5">
            <p className="text-overline">Quản lý nợ</p>
            <DebtStats debts={debts} />

            {/* Filter tabs */}
            <Tabs value={debtFilter} onValueChange={v => setDebtFilter(v as DebtFilter)}>
              <TabsList className="w-full h-10 bg-[var(--muted)] rounded-xl p-1">
                <TabsTrigger
                  value="open"
                  className="flex-1 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Đang mở
                </TabsTrigger>
                <TabsTrigger
                  value="settled"
                  className="flex-1 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Đã xử lý
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredDebts.length === 0 ? (
              <EmptyState
                icon={Handshake}
                title={debtFilter === 'open' ? 'Chưa có khoản nợ nào' : 'Chưa có khoản nợ đã xử lý'}
                subtitle={debtFilter === 'open' ? 'Nhấn + Ghi nợ để thêm' : undefined}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {filteredDebts.map(d => (
                  <DebtCard key={d.id} debt={d} onEdit={handleEditDebt} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

          {/* FAB - mobile only */}
          <FAB
            activeTab={activeTab}
            onIncome={handleOpenIncomForm}
            onExpense={handleOpenExpenseForm}
            onDebt={() => { setEditingDebt(null); setDebtFormOpen(true); }}
            isFirstTime={isFirstTime}
          />
        </div>
      </div>

      {/* Sheets & Dialogs */}
      <AddProfileSheet open={showAddProfile} onClose={() => setShowAddProfile(false)} />
      <TransactionForm
        open={txFormOpen}
        type={txFormType}
        editingTx={editingTx}
        onClose={() => { setTxFormOpen(false); setEditingTx(null); }}
      />
      <DebtForm
        open={debtFormOpen}
        onClose={() => { setDebtFormOpen(false); setEditingDebt(null); }}
        editingDebt={editingDebt}
      />

      <Toaster position="top-center" richColors />
    </div>
  );
}
