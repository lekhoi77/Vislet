'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { TabNav } from '@/components/layout/TabNav';
import { ProfileSwitcher } from '@/components/profile/ProfileSwitcher';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { FAB } from '@/components/layout/FAB';
import { OnboardingScreen } from '@/components/profile/OnboardingScreen';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionPane } from '@/components/transactions/TransactionPane';
import { DebtForm } from '@/components/debts/DebtForm';
import { SharedDebtCard } from '@/components/debts/SharedDebtCard';
import { DebtStats } from '@/components/debts/DebtStats';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { SourceBlocks } from '@/components/dashboard/SourceBlocks';
import { GoalBlocks } from '@/components/dashboard/GoalBlocks';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { GoalOverview } from '@/components/goals/GoalOverview';
import { CalendarBlock } from '@/components/dashboard/CalendarBlock';
import { ExpenseHeatmap } from '@/components/dashboard/ExpenseHeatmap';
import { TrendStatsCard } from '@/components/dashboard/TrendStatsCard';
import { AddSourceSheet } from '@/components/dashboard/AddSourceSheet';
import { AddBudgetSheet } from '@/components/dashboard/AddBudgetSheet';
import { WalkthroughTour } from '@/components/tour/WalkthroughTour';
import { CalculatorPanel } from '@/components/calculator/Calculator';
import { Transaction, TransactionType } from '@/lib/types';
import { getReportableTransactions } from '@/lib/transaction-reporting';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/EmptyState';
import { Handshake, LayoutDashboard, ArrowLeftRight, Tags, Plus, Calculator } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

const GREETINGS = [
  'Nay lỡ tiêu lố chưa',
  'Hôm nay tài chính ổn áp chứ',
  'Nay có tốn xiền trà sữa hông',
  'Ví nay còn dày hông dạ',
  'Sáng giờ có tốn đồng nào chưa',
  'Nay lượn lờ chốt đơn gì chưa',
  'Chốt sổ hôm nay chưa nè',
  'Gần cuối tháng rồi, sắp cháy túi chưa',
  'Tháng này ráng giữ tiền nha',
  'Nay có mua gì dỗ dành bản thân không',
  'Cuối ngày rồi, dòm lại ví xíu hông',
  'Mở app lên là chuẩn bị tốn tiền nữa hả',
  'Tiền tháng này đi đâu hết rồi',
  'Nay lỡ quẹt thẻ gắt quá không',
  'Hôm nay tiền bạc rủng rỉnh không',
  'Xài xong nhớ ghi sổ liền tay nha',
  'Mới lương về hay gì mà vô app đây',
  'Tháng này dư dả hông',
  'Nay có đi đu đưa đâu tốn kém không',
  'Thấy tiền nong dạo này sao rồi',
];

type ActiveTab = 'overview' | 'transactions' | 'categories' | 'debts';
type DebtFilter = 'owed_by_me' | 'owed_to_me' | 'settled';

const OPEN_DEBT_STATUSES = ['pending', 'active', 'pending_confirm'] as const;

export default function HomePage() {
  const { initApp, isLoaded, profiles, currentProfileId, transactions, sharedDebts } = useAppStore();
  const { user, isAuthLoading, initAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const prevUserIdRef = useRef<string | null>(null);

  // Transaction form state
  const [txFormOpen, setTxFormOpen] = useState(false);
  const [txFormType, setTxFormType] = useState<TransactionType>('income');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Debt form state
  const [debtFormOpen, setDebtFormOpen] = useState(false);

  // Month filter
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Auto-advance to current month when day rolls over (e.g. tab left open past midnight),
  // but only if user is still viewing what was the "current" month — don't yank them away
  // from a month they navigated to manually.
  const todayRef = useRef({ m: now.getMonth() + 1, y: now.getFullYear() });
  const viewRef = useRef({ m: month, y: year });
  useEffect(() => { viewRef.current = { m: month, y: year }; }, [month, year]);
  useEffect(() => {
    const check = () => {
      const n = new Date();
      const nm = n.getMonth() + 1, ny = n.getFullYear();
      const { m: pm, y: py } = todayRef.current;
      if (nm === pm && ny === py) return;
      const { m: vm, y: vy } = viewRef.current;
      if (vm === pm && vy === py) {
        setMonth(nm);
        setYear(ny);
        setContentKey(k => k + 1);
      }
      todayRef.current = { m: nm, y: ny };
    };
    const id = setInterval(check, 60_000);
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // Debt filter tab
  const [debtFilter, setDebtFilter] = useState<DebtFilter>('owed_to_me');

  // Source/budget manager sheets
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);

  // Calculator
  const [calcOpen, setCalcOpen] = useState(false);

  // Page content transition
  const [contentKey, setContentKey] = useState(0);

  // First time hint for FAB
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Walkthrough tour
  const [tourOpen, setTourOpen] = useState(false);
  const [guidePulse, setGuidePulse] = useState(false);
  const TOUR_SEEN_KEY = 'viapp_tour_seen';

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (user) {
      // Nếu account vừa đổi (login tài khoản khác) thì đóng overlay
      if (prevUserIdRef.current && prevUserIdRef.current !== user.id) {
        setShowLoginOverlay(false);
        useAppStore.setState({ profiles: [], currentProfileId: null, transactions: [], sharedDebts: [], notifications: [], debtContacts: [], customSources: [], customCategories: [], isLoaded: false });
      }
      prevUserIdRef.current = user.id;
      initApp();
    }
  }, [user, initApp]);

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
        // Auto-trigger walkthrough for new users (no transactions, never seen)
        try {
          const seen = localStorage.getItem(TOUR_SEEN_KEY);
          if (!seen && transactions.length === 0) {
            setTimeout(() => setTourOpen(true), 600);
          } else if (!seen) {
            setGuidePulse(true);
          }
        } catch { /* noop */ }
      }
    }
  }, [isLoaded, profiles.length, transactions.length]);

  const handleCloseTour = useCallback(() => {
    setTourOpen(false);
    setGuidePulse(false);
    try { localStorage.setItem(TOUR_SEEN_KEY, '1'); } catch { /* noop */ }
  }, []);

  const handleOpenTour = useCallback(() => {
    setGuidePulse(false);
    setTourOpen(true);
  }, []);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(prev => {
      if (prev !== tab) setContentKey(k => k + 1);
      return tab;
    });
    window.scrollTo({ top: 0 });
  }, []);

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

  const handleSelectMonth = useCallback((m: number, y: number) => {
    setMonth(m);
    setYear(y);
    setContentKey(k => k + 1);
    window.scrollTo({ top: 0 });
  }, []);

  const handleToday = useCallback(() => {
    const n = new Date();
    setMonth(n.getMonth() + 1);
    setYear(n.getFullYear());
    setContentKey(k => k + 1);
    window.scrollTo({ top: 0 });
  }, []);

  // Shortcuts:  T = Thu nhập  |  E = Chi tiêu  |  C = Mở máy tính
  // Esc closes (handled by base-ui Dialog for modals, and by Calculator itself).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleOpenIncomForm();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleOpenExpenseForm();
      } else if (e.key === 'c' || e.key === 'C') {
        if (!calcOpen) {
          e.preventDefault();
          setCalcOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleOpenIncomForm, handleOpenExpenseForm, calcOpen]);

  const filteredDebts = sharedDebts.filter(d => {
    if (debtFilter === 'settled') return d.status === 'settled';
    if (!(OPEN_DEBT_STATUSES as readonly string[]).includes(d.status)) return false;
    if (debtFilter === 'owed_by_me') return d.debtorUserId === user?.id;
    return d.creditorUserId === user?.id;
  });
  const monthTxs = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });
  const reportableTransactions = getReportableTransactions(transactions);

  if (isAuthLoading || (user && !isLoaded)) {
    return (
      <div className="app-container flex items-center justify-center min-h-dvh">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-text.svg" alt="Vislet" style={{ height: 100, width: 'auto' }} />
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full skeleton-animate" style={{ background: 'var(--primary)', animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
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
    { value: 'categories' as ActiveTab, label: 'Danh mục', icon: Tags },
    { value: 'debts' as ActiveTab, label: 'Nợ', icon: Handshake },
  ];

  const currentProfile = profiles.find(p => p.id === currentProfileId);
  const greetingName = currentProfile?.name ?? '';
  const greetingSeed = greetingName.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const greeting = GREETINGS[greetingSeed % GREETINGS.length];

  return (
    <div className="app-container relative">
      {/* Ambient green gradient backdrop */}
      <div className="app-backdrop" aria-hidden />

      <div className="relative z-10" style={{ minHeight: '100dvh' }}>
        {/* Desktop floating sidebar */}
        <aside
          className="hidden md:flex flex-col w-56 shrink-0 fixed overflow-y-auto rounded-2xl"
          style={{
            top: 24,
            left: 24,
            height: 'calc(100dvh - 48px)',
            background: 'var(--card)',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px rgba(16, 24, 40, 0.06), 0 0 0 1px rgba(16, 24, 40, 0.05)',
          }}
        >
          <div className="px-4 pt-5 pb-3">
            <img src="/logo-text.svg" alt="Vislet" style={{ height: 52, width: 'auto' }} />
          </div>
          <nav className="flex flex-col gap-1 p-3 flex-1">
            {DESKTOP_TABS.map(({ value, label, icon: Icon }) => {
              const isActive = activeTab === value;
              return (
                <button
                  key={value}
                  data-tour={`tab-${value}`}
                  onClick={() => handleTabChange(value)}
                  className="sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left"
                  style={{
                    background: isActive ? 'var(--primary-soft)' : 'transparent',
                    color: isActive ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? 'var(--primary)' : undefined }} />
                  {label}
                </button>
              );
            })}
          </nav>
          <div data-tour="fab" className="relative z-10 p-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {activeTab === 'debts' ? (
              <button
                onClick={() => setDebtFormOpen(true)}
                className="flex items-center gap-2 h-10 md:h-12 px-4 rounded-xl font-semibold text-sm w-full justify-center transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <Plus size={15} /> Ghi nợ
              </button>
            ) : (
              <>
                <div className="relative group">
                  <button
                    onClick={handleOpenIncomForm}
                    className="flex items-center gap-2 h-10 md:h-12 px-4 rounded-xl font-semibold text-sm w-full justify-center transition-all hover:bg-[var(--primary-soft)] active:scale-95"
                    style={{ border: '2px solid var(--primary)', color: 'var(--primary)', background: 'transparent' }}
                  >
                    <Plus size={15} /> Thu nhập
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-150 z-50"
                    style={{ background: '#1a1a1a', color: '#fff' }}>
                    T
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={handleOpenExpenseForm}
                    className="flex items-center gap-2 h-10 md:h-12 px-4 rounded-xl font-semibold text-sm w-full justify-center transition-all hover:bg-[var(--orange-soft)] active:scale-95"
                    style={{ border: '2px solid var(--orange)', color: 'var(--orange)', background: 'transparent' }}
                  >
                    <Plus size={15} /> Chi tiêu
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-150 z-50"
                    style={{ background: '#1a1a1a', color: '#fff' }}>
                    E
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Content area — offset for fixed sidebar on desktop (24+224+24 = 272) */}
        <div className="flex-1 min-w-0 md:pl-[272px] md:pr-6 md:pb-6">
          {/* Greeting + top-right actions (replaces old Header) */}
          <div className="flex items-start justify-between gap-3 px-5 md:px-0 pt-5 md:pt-6 pb-3 md:pb-5">
            <div className="min-w-0">
              <h1 className="font-semibold leading-tight text-xl md:text-2xl">
                <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>Hi,</span>{' '}
                <span className="user-name-hand">{greetingName}</span>{' '}
                <span aria-hidden>🐱</span>
              </h1>
              <p className="text-xs md:text-sm mt-0.5 md:mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {greeting}?
              </p>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <button
                type="button"
                data-tour="calc"
                onClick={() => setCalcOpen(v => !v)}
                className="hidden md:flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--muted)]"
                style={{
                  width: 40,
                  height: 40,
                  background: 'var(--card)',
                  boxShadow: '0 0 0 1px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
                }}
                aria-label="Mở máy tính (phím C)"
                title="Máy tính — phím C"
              >
                <Calculator
                  size={18}
                  style={{ color: calcOpen ? 'var(--primary)' : 'var(--foreground)' }}
                />
              </button>

              <div
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: 40,
                  height: 40,
                  background: 'var(--card)',
                  boxShadow: '0 0 0 1px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
                }}
              >
                <NotificationBell />
              </div>

              <div data-tour="profile">
                <ProfileSwitcher
                  onAddAccount={() => setShowLoginOverlay(true)}
                  onOpenGuide={handleOpenTour}
                  guidePulse={guidePulse}
                />
              </div>
            </div>
          </div>

          <TabNav value={activeTab} onChange={handleTabChange} />

          <main className="content-card mx-4 mt-6 md:mt-0 md:mx-0 mb-4 md:mb-0 pb-[120px] md:pb-6 overflow-hidden">
        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div
            key={`overview-${contentKey}`}
            className="page-appear flex flex-col gap-6 p-5 pt-5 md:p-7 md:pt-7"
          >
            <div className="flex items-center">
              <MonthSelector month={month} year={year} onPrev={handlePrevMonth} onNext={handleNextMonth} onSelect={handleSelectMonth} onToday={handleToday} />
            </div>
            <div data-tour="summary">
              <SummaryCards
                transactions={reportableTransactions}
                month={month}
                year={year}
                sharedDebts={sharedDebts}
                currentUserId={user?.id ?? ''}
                onSeeAllDebts={() => handleTabChange('debts')}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div data-tour="sources" className="flex flex-col md:h-[440px]">
                <SourceBlocks
                  transactions={reportableTransactions}
                  title="Nguồn tiền"
                  onAdd={() => setShowAddSource(true)}
                  addLabel="Thêm nguồn tiền"
                />
              </div>
              <div data-tour="goals" className="flex flex-col md:h-[440px]">
                <GoalBlocks
                  transactions={reportableTransactions}
                  month={month}
                  year={year}
                  title="Danh mục"
                  onAdd={() => setShowAddBudget(true)}
                  addLabel="Thêm danh mục"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <TrendStatsCard
                transactions={reportableTransactions}
                month={month}
                year={year}
              />
              <div data-tour="calendar" className="xl:h-full">
                <CalendarBlock transactions={reportableTransactions} sharedDebts={sharedDebts} month={month} year={year} onEdit={handleEditTx} />
              </div>
              <div className="xl:h-full">
                <ExpenseHeatmap transactions={reportableTransactions} month={month} year={year} onEdit={handleEditTx} />
              </div>
            </div>
          </div>
        )}

        {/* ─── TRANSACTIONS TAB ─── */}
        {activeTab === 'transactions' && (
          <div key={`tx-${contentKey}`} className="page-appear flex flex-col gap-4 pt-5">
            <div className="flex items-center justify-between px-5">
              <p className="text-overline">Lịch sử giao dịch</p>
              <MonthSelector month={month} year={year} onPrev={handlePrevMonth} onNext={handleNextMonth} onSelect={handleSelectMonth} onToday={handleToday} />
            </div>
            <TransactionPane transactions={monthTxs} onEdit={handleEditTx} />
          </div>
        )}

        {/* ─── CATEGORIES TAB ─── */}
        {activeTab === 'categories' && (
          <div key={`categories-${contentKey}`} className="page-appear p-5 pt-5">
            <GoalOverview transactions={reportableTransactions} month={month} year={year} onEdit={handleEditTx} />
          </div>
        )}

        {/* ─── DEBTS TAB ─── */}
        {activeTab === 'debts' && (
          <div key={`debts-${contentKey}`} className="page-appear flex flex-col gap-5 p-5 pt-5">
            <p className="text-overline">Quản lý nợ</p>
            <DebtStats sharedDebts={sharedDebts} currentUserId={user?.id ?? ''} />

            {/* Filter tabs */}
            <Tabs value={debtFilter} onValueChange={v => setDebtFilter(v as DebtFilter)}>
              <TabsList className="w-full h-10 bg-[var(--muted)] rounded-xl p-1">
                <TabsTrigger
                  value="owed_to_me"
                  className="flex-1 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Họ nợ tôi
                </TabsTrigger>
                <TabsTrigger
                  value="owed_by_me"
                  className="flex-1 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Tôi đang nợ
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
                title={debtFilter === 'settled' ? 'Chưa có khoản nợ đã xử lý' : 'Chưa có khoản nợ nào'}
                subtitle={debtFilter === 'settled' ? undefined : 'Nhấn + Ghi nợ để thêm'}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {filteredDebts.map(d => (
                  <SharedDebtCard key={d.id} debt={d} currentUserId={user?.id ?? ''} />
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
            onDebt={() => setDebtFormOpen(true)}
            isFirstTime={isFirstTime}
          />
        </div>
      </div>

      {/* Sheets & Dialogs */}
      {/* Login overlay khi "Thêm người dùng" */}
      {showLoginOverlay && (
        <div className="fixed inset-0 z-[100]">
          <LoginScreen />
          <button
            onClick={() => setShowLoginOverlay(false)}
            className="fixed top-4 right-5 text-sm font-medium px-3 py-1.5 rounded-xl z-[101] hover:bg-[var(--muted)] transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Huỷ
          </button>
        </div>
      )}
      <TransactionForm
        open={txFormOpen}
        type={txFormType}
        editingTx={editingTx}
        onClose={() => { setTxFormOpen(false); setEditingTx(null); }}
      />
      <DebtForm
        open={debtFormOpen}
        onClose={() => setDebtFormOpen(false)}
      />

      <AddSourceSheet open={showAddSource} onClose={() => setShowAddSource(false)} />
      <AddBudgetSheet open={showAddBudget} onClose={() => setShowAddBudget(false)} />
      <WalkthroughTour
        open={tourOpen}
        onClose={handleCloseTour}
        onRequestTab={handleTabChange}
      />

      {/* Calculator — floating on desktop, bottom sheet on mobile */}
      <CalculatorPanel open={calcOpen} onClose={() => setCalcOpen(false)} />

      <Toaster position="top-center" richColors />
    </div>
  );
}
