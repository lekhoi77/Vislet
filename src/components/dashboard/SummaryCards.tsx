'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Transaction, SharedExpense, SharedExpenseStatus } from '@/lib/types';
import { formatVND, formatVNDShort } from '@/lib/format';
import { SummaryCardSkeleton } from './SummaryCardSkeleton';
import { Wallet, TrendingUp, TrendingDown, Handshake, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';

interface SummaryCardsProps {
  transactions: Transaction[];
  month: number;
  year: number;
  sharedExpenses: SharedExpense[];
  currentUserId: string;
  onSeeAllSharedExpenses?: () => void;
  isLoading?: boolean;
}

const OPEN_SHARED_EXPENSE_STATUSES: SharedExpenseStatus[] = ['pending', 'active', 'pending_confirm'];

function monthPrev(m: number, y: number): { m: number; y: number } {
  return m === 1 ? { m: 12, y: y - 1 } : { m: m - 1, y };
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function sumByType(txs: Transaction[], m: number, y: number, type: 'income' | 'expense'): number {
  return txs.reduce((s, t) => {
    if (t.type !== type) return s;
    const d = new Date(t.date);
    if (d.getMonth() + 1 !== m || d.getFullYear() !== y) return s;
    return s + t.amount;
  }, 0);
}

function sumAllByType(txs: Transaction[], type: 'income' | 'expense'): number {
  return txs.reduce((s, t) => (t.type === type ? s + t.amount : s), 0);
}

function sumByTypeBeforeMonth(txs: Transaction[], m: number, y: number, type: 'income' | 'expense'): number {
  return txs.reduce((s, t) => {
    if (t.type !== type) return s;
    const d = new Date(t.date);
    const tm = d.getMonth() + 1;
    const ty = d.getFullYear();
    if (ty < y || (ty === y && tm < m)) return s + t.amount;
    return s;
  }, 0);
}

function sharedExpenseSortTime(e: SharedExpense): number {
  return new Date(e.settledAt ?? e.acceptedAt ?? e.createdAt).getTime();
}

const STATUS_LABEL: Record<SharedExpenseStatus, string> = {
  pending: 'Chờ',
  active: 'Đang mở',
  pending_confirm: 'Chờ xác nhận',
  settled: 'Đã trả',
  rejected: 'Từ chối',
  cancelled: 'Đã huỷ',
};

function statusColor(s: SharedExpenseStatus): { bg: string; fg: string } {
  switch (s) {
    case 'active':         return { bg: 'var(--primary-soft)', fg: 'var(--primary)' };
    case 'pending':        return { bg: 'hsl(45, 100%, 94%)', fg: 'hsl(40, 80%, 38%)' };
    case 'pending_confirm':return { bg: 'hsl(45, 100%, 94%)', fg: 'hsl(40, 80%, 38%)' };
    case 'settled':        return { bg: 'var(--muted)', fg: 'var(--muted-foreground)' };
    default:               return { bg: 'var(--muted)', fg: 'var(--muted-foreground)' };
  }
}

// ─── Reusable card shell ──────────────────────────────────────
const CARD_STYLE: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-card)',
};

// ─── Stat card (cards 1-3) ────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  iconColor?: string;
  iconBg?: string;
  deltaPct: number | null;
  /** When true, an UP delta is "bad" (e.g. expense growing). Inverts chip color. */
  invertDelta?: boolean;
}

function DeltaChip({ pct, invert }: { pct: number; invert?: boolean }) {
  const isUp = pct >= 0;
  // A rise in expense is "down" semantically; flip for invertDelta cards
  const isGood = invert ? !isUp : isUp;
  const color = isGood ? 'var(--up)' : 'var(--down)';
  const bg = isGood ? 'hsl(145, 55%, 94%)' : 'hsl(0, 70%, 95%)';
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold"
      style={{ background: bg, color }}
    >
      <Icon size={12} />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

function StatCard({ icon, label, value, valueColor, iconColor, iconBg, deltaPct, invertDelta }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2.5 p-3.5 md:gap-3 md:p-4 rounded-2xl min-w-0 h-full" style={CARD_STYLE}>
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 26, height: 26, background: iconBg ?? 'var(--primary-soft)', color: iconColor ?? 'var(--primary)' }}
        >
          <span className="scale-[0.92] md:scale-100">{icon}</span>
        </div>
        <span
          className="text-[12px] md:text-sm font-semibold leading-tight break-words"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {label}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <p
          className="text-xl md:text-2xl font-bold amount leading-none"
          style={{ color: valueColor ?? 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.01em' }}
        >
          {value}
        </p>
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-1.5 mt-2.5 md:mt-3 min-h-[34px] md:min-h-[24px]">
          {deltaPct !== null ? (
            <>
              <DeltaChip pct={deltaPct} invert={invertDelta} />
              <span className="text-[12px] md:text-xs leading-tight" style={{ color: 'var(--muted-foreground)' }}>vs tháng trước</span>
            </>
          ) : (
            <span className="text-[12px] md:text-xs" style={{ color: 'var(--muted-foreground)' }}>&nbsp;</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared expense summary card (card 4) ──────────────────────
interface SharedExpenseSummaryCardProps {
  expenses: SharedExpense[];
  currentUserId: string;
  onSeeAll?: () => void;
}

function counterpartyName(e: SharedExpense, currentUserId: string): string {
  if (e.ownerUserId === currentUserId) return e.participantName || 'Người dùng';
  return e.ownerName || 'Người dùng';
}

function SharedExpenseSummaryCard({ expenses, currentUserId, onSeeAll }: SharedExpenseSummaryCardProps) {
  const openExpenses = expenses.filter(e => OPEN_SHARED_EXPENSE_STATUSES.includes(e.status));
  const totalOpen = openExpenses.reduce((s, e) => s + e.remainingAmount, 0);

  const recent = [...expenses]
    .filter(e => !['settled', 'rejected', 'cancelled'].includes(e.status))
    .sort((a, b) => sharedExpenseSortTime(b) - sharedExpenseSortTime(a))
    .slice(0, 3);

  return (
    <div
      className="col-span-1 md:col-span-2 flex flex-col md:grid md:grid-cols-[1fr_1.2fr] gap-3 md:gap-4 p-4 rounded-2xl"
      style={CARD_STYLE}
    >
      {/* ── Left: stat header ── */}
      <div className="flex flex-col gap-2 md:justify-center">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 28, height: 28, background: 'var(--split-soft)', color: 'var(--split)' }}
          >
            <Handshake size={15} />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Chi chung đang mở</span>
        </div>
        <p
          className="text-xl md:text-2xl font-bold amount"
          style={{ color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.01em' }}
        >
          {formatVND(totalOpen)}
        </p>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {openExpenses.length} khoản đang mở
        </span>
        {/* Mobile-only see-all link (list is hidden on mobile) */}
        {onSeeAll && expenses.length > 0 && (
          <button
            type="button"
            onClick={onSeeAll}
            className="md:hidden flex items-center gap-0.5 text-xs font-medium mt-1 transition-colors hover:opacity-80"
            style={{ color: 'var(--primary)' }}
          >
            Xem tất cả <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* ── Right: recent shared expenses list (desktop only) ── */}
      <div className="hidden md:flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-end">
          {onSeeAll && expenses.length > 0 && (
            <button
              type="button"
              onClick={onSeeAll}
              className="flex items-center gap-0.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              Xem tất cả <ChevronRight size={12} />
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <p className="text-xs py-3 text-center" style={{ color: 'var(--muted-foreground)' }}>
            Chưa có khoản chi chung nào
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {recent.map(e => {
              const name = counterpartyName(e, currentUserId);
              const initial = name.charAt(0).toUpperCase();
              const colors = statusColor(e.status);
              return (
                <li key={e.id} className="flex items-center gap-2 min-w-0">
                  <div
                    className="flex items-center justify-center rounded-full shrink-0 text-xs font-semibold"
                    style={{ width: 24, height: 24, background: 'var(--muted)', color: 'var(--foreground)' }}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{name}</p>
                    <p className="text-xs amount" style={{ color: 'var(--muted-foreground)' }}>
                      {formatVNDShort(e.remainingAmount)}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                    style={{ background: colors.bg, color: colors.fg }}
                  >
                    {STATUS_LABEL[e.status]}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────
export function SummaryCards({
  transactions,
  month,
  year,
  sharedExpenses,
  currentUserId,
  onSeeAllSharedExpenses,
  isLoading,
}: SummaryCardsProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isInteractingRef = useRef(false);

  const income = sumByType(transactions, month, year, 'income');
  const expense = sumByType(transactions, month, year, 'expense');
  const balance = sumAllByType(transactions, 'income') - sumAllByType(transactions, 'expense');

  const { m: pm, y: py } = monthPrev(month, year);
  const incomePrev = sumByType(transactions, pm, py, 'income');
  const expensePrev = sumByType(transactions, pm, py, 'expense');
  const balancePrev = sumByTypeBeforeMonth(transactions, month, year, 'income')
    - sumByTypeBeforeMonth(transactions, month, year, 'expense');

  const cards = [
    <StatCard
      key="balance"
      icon={<Wallet size={15} />}
      label="Số dư tháng"
      value={formatVND(Math.max(0, balance))}
      iconColor="var(--muted-foreground)"
      iconBg="var(--muted)"
      deltaPct={pctDelta(balance, balancePrev)}
    />,
    <StatCard
      key="income"
      icon={<TrendingUp size={15} />}
      label="Thu nhập"
      value={formatVND(income)}
      valueColor="var(--income)"
      deltaPct={pctDelta(income, incomePrev)}
    />,
    <StatCard
      key="expense"
      icon={<TrendingDown size={15} />}
      label="Chi tiêu"
      value={formatVND(expense)}
      valueColor="var(--orange)"
      iconColor="var(--orange)"
      iconBg="var(--orange-soft)"
      deltaPct={pctDelta(expense, expensePrev)}
      invertDelta
    />,
    <SharedExpenseSummaryCard
      key="shared"
      expenses={sharedExpenses}
      currentUserId={currentUserId}
      onSeeAll={onSeeAllSharedExpenses}
    />,
  ];

  const totalSlides = cards.length;

  const stopAuto = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAuto = useCallback(() => {
    const el = carouselRef.current;
    if (!el || totalSlides <= 1) return;
    if (intervalRef.current !== null) return;
    intervalRef.current = window.setInterval(() => {
      if (isInteractingRef.current) return;
      setCurrentSlide(prev => {
        const next = (prev + 1) % totalSlides;
        const width = el.clientWidth;
        if (width > 0) el.scrollTo({ left: next * width, behavior: 'smooth' });
        return next;
      });
    }, 10_000);
  }, [totalSlides]);

  useEffect(() => {
    startAuto();
    return () => stopAuto();
  }, [startAuto, stopAuto]);

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (width <= 0) return;
    const index = Math.round(el.scrollLeft / width);
    setCurrentSlide(Math.min(totalSlides - 1, Math.max(0, index)));
  };

  const jumpToSlide = (index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (width <= 0) return;
    el.scrollTo({ left: index * width, behavior: 'smooth' });
    setCurrentSlide(index);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 md:gap-3 items-stretch">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <div className="col-span-2 md:col-span-2"><SummaryCardSkeleton hasList /></div>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <div className="rounded-2xl overflow-hidden">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            onTouchStart={() => { isInteractingRef.current = true; stopAuto(); }}
            onTouchEnd={() => { isInteractingRef.current = false; startAuto(); }}
            onTouchCancel={() => { isInteractingRef.current = false; startAuto(); }}
            onMouseDown={() => { isInteractingRef.current = true; stopAuto(); }}
            onMouseUp={() => { isInteractingRef.current = false; startAuto(); }}
            onMouseLeave={() => { isInteractingRef.current = false; startAuto(); }}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth px-3 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollPaddingLeft: 12, scrollPaddingRight: 12 }}
          >
            {cards.map((card, index) => (
              <div key={index} className="w-full shrink-0 snap-center px-1.5">
                {card}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {cards.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => jumpToSlide(index)}
              className="rounded-full transition-all"
              style={{
                width: currentSlide === index ? 16 : 6,
                height: 6,
                background: currentSlide === index ? 'var(--primary)' : 'var(--primary-muted)',
                opacity: currentSlide === index ? 0.95 : 0.55,
              }}
              aria-label={`Đến thẻ ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="hidden md:grid grid-cols-5 gap-3 items-stretch">
        <div>{cards[0]}</div>
        <div>{cards[1]}</div>
        <div>{cards[2]}</div>
        <div className="col-span-2">{cards[3]}</div>
      </div>
    </>
  );
}
