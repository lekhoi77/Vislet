'use client';

import { Transaction, SharedDebt, SharedDebtStatus } from '@/lib/types';
import { formatVND, formatVNDShort } from '@/lib/format';
import { SummaryCardSkeleton } from './SummaryCardSkeleton';
import { Wallet, TrendingUp, TrendingDown, Handshake, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';

interface SummaryCardsProps {
  transactions: Transaction[];
  month: number;
  year: number;
  sharedDebts: SharedDebt[];
  currentUserId: string;
  onSeeAllDebts?: () => void;
  isLoading?: boolean;
}

const OPEN_DEBT_STATUSES: SharedDebtStatus[] = ['pending', 'active', 'pending_confirm'];

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

function debtSortTime(d: SharedDebt): number {
  return new Date(d.settledAt ?? d.acceptedAt ?? d.createdAt).getTime();
}

const STATUS_LABEL: Record<SharedDebtStatus, string> = {
  pending: 'Chờ',
  active: 'Đang nợ',
  pending_confirm: 'Chờ xác nhận',
  settled: 'Đã trả',
  rejected: 'Từ chối',
  cancelled: 'Đã huỷ',
};

function statusColor(s: SharedDebtStatus): { bg: string; fg: string } {
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
    <div className="flex flex-col gap-3 p-4 rounded-2xl" style={CARD_STYLE}>
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 28, height: 28, background: iconBg ?? 'var(--primary-soft)', color: iconColor ?? 'var(--primary)' }}
        >
          {icon}
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      </div>
      <div>
        <p
          className="text-xl md:text-2xl font-bold amount"
          style={{ color: valueColor ?? 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.01em' }}
        >
          {value}
        </p>
        <div className="flex items-center gap-1.5 mt-3">
          {deltaPct !== null ? (
            <>
              <DeltaChip pct={deltaPct} invert={invertDelta} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>vs tháng trước</span>
            </>
          ) : (
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>—</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Debt card (card 4) ───────────────────────────────────────
interface DebtCardProps {
  debts: SharedDebt[];
  currentUserId: string;
  onSeeAll?: () => void;
}

function counterpartyName(d: SharedDebt, currentUserId: string): string {
  if (d.creditorUserId === currentUserId) return d.debtorName || 'Người dùng';
  return d.creditorName || 'Người dùng';
}

function DebtCard({ debts, currentUserId, onSeeAll }: DebtCardProps) {
  const openDebts = debts.filter(d => OPEN_DEBT_STATUSES.includes(d.status));
  const totalOpen = openDebts.reduce((s, d) => s + d.remainingAmount, 0);

  const recent = [...debts]
    .filter(d => !['settled', 'rejected', 'cancelled'].includes(d.status))
    .sort((a, b) => debtSortTime(b) - debtSortTime(a))
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
            style={{ width: 28, height: 28, background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            <Handshake size={15} />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Nợ còn lại</span>
        </div>
        <p
          className="text-xl md:text-2xl font-bold amount"
          style={{ color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.01em' }}
        >
          {formatVND(totalOpen)}
        </p>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {openDebts.length} khoản đang mở
        </span>
        {/* Mobile-only see-all link (list is hidden on mobile) */}
        {onSeeAll && debts.length > 0 && (
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

      {/* ── Right: recent debts list (desktop only) ── */}
      <div className="hidden md:flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-end">
          {onSeeAll && debts.length > 0 && (
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
            Chưa có khoản nợ nào
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {recent.map(d => {
              const name = counterpartyName(d, currentUserId);
              const initial = name.charAt(0).toUpperCase();
              const colors = statusColor(d.status);
              return (
                <li key={d.id} className="flex items-center gap-2 min-w-0">
                  <div
                    className="flex items-center justify-center rounded-full shrink-0 text-xs font-semibold"
                    style={{ width: 24, height: 24, background: 'var(--muted)', color: 'var(--foreground)' }}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{name}</p>
                    <p className="text-xs amount" style={{ color: 'var(--muted-foreground)' }}>
                      {formatVNDShort(d.remainingAmount)}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                    style={{ background: colors.bg, color: colors.fg }}
                  >
                    {STATUS_LABEL[d.status]}
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
  sharedDebts,
  currentUserId,
  onSeeAllDebts,
  isLoading,
}: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-stretch">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <div className="col-span-2 md:col-span-2"><SummaryCardSkeleton hasList /></div>
      </div>
    );
  }

  const income = sumByType(transactions, month, year, 'income');
  const expense = sumByType(transactions, month, year, 'expense');
  const balance = sumAllByType(transactions, 'income') - sumAllByType(transactions, 'expense');

  const { m: pm, y: py } = monthPrev(month, year);
  const incomePrev = sumByType(transactions, pm, py, 'income');
  const expensePrev = sumByType(transactions, pm, py, 'expense');
  const balancePrev = sumByTypeBeforeMonth(transactions, month, year, 'income')
    - sumByTypeBeforeMonth(transactions, month, year, 'expense');

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-stretch">
      <StatCard
        icon={<Wallet size={15} />}
        label="Số dư tháng"
        value={formatVND(Math.max(0, balance))}
        iconColor="var(--muted-foreground)"
        iconBg="var(--muted)"
        deltaPct={pctDelta(balance, balancePrev)}
      />
      <StatCard
        icon={<TrendingUp size={15} />}
        label="Thu nhập"
        value={formatVND(income)}
        valueColor="var(--income)"
        deltaPct={pctDelta(income, incomePrev)}
      />
      <StatCard
        icon={<TrendingDown size={15} />}
        label="Chi tiêu"
        value={formatVND(expense)}
        valueColor="var(--orange)"
        iconColor="var(--orange)"
        iconBg="var(--orange-soft)"
        deltaPct={pctDelta(expense, expensePrev)}
        invertDelta
      />
      <DebtCard
        debts={sharedDebts}
        currentUserId={currentUserId}
        onSeeAll={onSeeAllDebts}
      />
    </div>
  );
}
