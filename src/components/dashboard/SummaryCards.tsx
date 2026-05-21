'use client';

import { useEffect, useState, useMemo } from 'react';
import { Transaction } from '@/lib/types';
import { formatCurrentDateTime, formatVND, formatVNDShort } from '@/lib/format';
import { useAppStore } from '@/store/app-store';
import { SummaryCardSkeleton } from './SummaryCardSkeleton';

interface SummaryCardsProps {
  transactions: Transaction[];
  month: number;
  year: number;
  isLoading?: boolean;
}

function card(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    ...extra,
  };
}

// ── Greeting pool ──────────────────────────────────────────────
// Tất cả câu KHÔNG có dấu câu cuối — sẽ tự thêm ", Tên?"
const GREETINGS = [
  'Hôm nay bạn thấy thế nào',
  'Có ai rủ bạn đi ăn không',
  'Ví tiền hôm nay ổn không',
  'Hôm nay tiêu xài có vui không',
  'Cà phê sáng tính vào đâu chưa',
  'Bữa trưa ăn gì chưa tính chưa',
  'Cuối tháng rồi ví còn bao nhiêu',
  'Mua sắm hôm nay có gì hay không',
  'Hôm nay có đặt mục tiêu gì chưa',
  'Tháng này chi tiêu ổn không',
  'Có khoản nào chưa ghi lại không',
  'Hôm nay bỏ ống heo được không',
  'Đi ăn ngoài hay tự nấu hôm nay',
  'Tháng này tiết kiệm được bao nhiêu',
  'Cuối tuần có kế hoạch gì chưa',
];

function LiveDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
      {formatCurrentDateTime(now)}
    </p>
  );
}

function DeltaRow({ label, delta, isExpense }: { label: string; delta: number; isExpense: boolean }) {
  const isZero = delta === 0;
  const isUp = delta > 0;
  let color = 'var(--muted-foreground)';
  if (!isZero) {
    color = isExpense
      ? (isUp ? 'var(--expense)' : 'var(--income)')
      : (isUp ? 'var(--income)' : 'var(--expense)');
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm leading-tight" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span className="text-sm font-semibold shrink-0" style={{ color }}>
        {isZero ? '—' : `${isUp ? '↑' : '↓'} ${formatVNDShort(Math.abs(delta))}`}
      </span>
    </div>
  );
}

// ── Greeting card (left panel) ─────────────────────────────────
interface GreetingCardProps {
  profileName?: string;
  deltaIncome: number;
  deltaExpense: number;
  isCurrentMonth: boolean;
}

function GreetingCard({ profileName, deltaIncome, deltaExpense, isCurrentMonth }: GreetingCardProps) {
  // Pick one greeting per mount — won't re-randomise on re-renders
  const greeting = useMemo(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)], []);

  return (
    <>
      {/* Google Font — Playwrite England SemiJoined */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playwrite+England+SemiJoined&display=swap');`}</style>

      <div className="flex flex-col justify-between p-4 rounded-2xl" style={card({ minHeight: 148 })}>
        <div>
          <LiveDateTime />
          <p className="text-base font-bold leading-snug mt-1" style={{ color: 'var(--foreground)' }}>
            {greeting}
            {profileName ? (
              <>
                {', '}
                <span
                  style={{
                    fontFamily: "'Playwrite England SemiJoined', cursive",
                    fontWeight: 400,
                    fontSize: '1.125rem',
                    background: 'linear-gradient(90deg, var(--primary) 0%, var(--orange) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {profileName}?
                </span>
              </>
            ) : '?'}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 mt-3">
          <DeltaRow label="Thu nhập hôm nay" delta={isCurrentMonth ? deltaIncome : 0} isExpense={false} />
          <DeltaRow label="Chi tiêu hôm nay" delta={isCurrentMonth ? deltaExpense : 0} isExpense={true} />
        </div>
      </div>
    </>
  );
}

// ── Main export ────────────────────────────────────────────────
export function SummaryCards({ transactions, month, year, isLoading }: SummaryCardsProps) {
  const { profiles, currentProfileId } = useAppStore();
  const profile = profiles.find(p => p.id === currentProfileId);

  const filtered = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const incomeCount = filtered.filter(t => t.type === 'income').length;
  const expenseCount = filtered.filter(t => t.type === 'expense').length;

  // Today vs yesterday delta (only relevant when viewing current month)
  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 86_400_000;

  const sumDay = (type: 'income' | 'expense', start: number) =>
    transactions
      .filter(t => { const ts = new Date(t.date).getTime(); return t.type === type && ts >= start && ts < start + dayMs; })
      .reduce((s, t) => s + t.amount, 0);

  const deltaIncome = isCurrentMonth ? sumDay('income', todayStart) - sumDay('income', todayStart - dayMs) : 0;
  const deltaExpense = isCurrentMonth ? sumDay('expense', todayStart) - sumDay('expense', todayStart - dayMs) : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <SummaryCardSkeleton />
        <div className="flex flex-col gap-3">
          <SummaryCardSkeleton />
          <div className="grid grid-cols-2 gap-3">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* ── Left: greeting + today delta ── */}
      <GreetingCard
        profileName={profile?.name}
        deltaIncome={deltaIncome}
        deltaExpense={deltaExpense}
        isCurrentMonth={isCurrentMonth}
      />

      {/* ── Right: balance + income/expense ── */}
      <div className="flex flex-col gap-3">
        {/* Balance */}
        <div className="flex flex-col gap-0.5 p-4 rounded-2xl flex-1 justify-center" style={card()}>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
            <span className="text-overline">Số dư</span>
          </div>
          <p
            className="text-xl font-bold amount"
            style={{ color: balance >= 0 ? 'var(--foreground)' : 'var(--expense)', lineHeight: 1.2, letterSpacing: '-0.01em' }}
          >
            {formatVND(Math.max(0, balance))}
          </p>
        </div>

        {/* Income + Expense */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5 p-3 rounded-2xl" style={card()}>
            <div className="flex items-center gap-1">
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--income)', flexShrink: 0 }} />
              <span className="text-[14px] font-semibold uppercase tracking-wide truncate" style={{ color: 'var(--muted-foreground)' }}>Thu</span>
            </div>
            <p className="text-sm font-bold amount" style={{ color: 'var(--income)', lineHeight: 1.2 }}>{formatVND(income)}</p>
            <p className="text-[14px]" style={{ color: 'var(--muted-foreground)' }}>{incomeCount} GD</p>
          </div>
          <div className="flex flex-col gap-0.5 p-3 rounded-2xl" style={card()}>
            <div className="flex items-center gap-1">
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--expense)', flexShrink: 0 }} />
              <span className="text-[14px] font-semibold uppercase tracking-wide truncate" style={{ color: 'var(--muted-foreground)' }}>Chi</span>
            </div>
            <p className="text-sm font-bold amount" style={{ color: 'var(--expense)', lineHeight: 1.2 }}>{formatVND(expense)}</p>
            <p className="text-[14px]" style={{ color: 'var(--muted-foreground)' }}>{expenseCount} GD</p>
          </div>
        </div>
      </div>
    </div>
  );
}
