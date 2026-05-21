'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, Debt } from '@/lib/types';
import { formatVND } from '@/lib/format';
import { resolveSourceLabel, resolveGoalLabel } from '@/lib/constants';
import { useAppStore } from '@/store/app-store';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ArrowDownLeft, ArrowUpRight, Handshake, Inbox } from 'lucide-react';

interface DayDetailSheetProps {
  date: Date | null;
  transactions: Transaction[];
  filterType?: 'income' | 'expense' | 'all';
  debts?: Debt[];
  onEdit?: (tx: Transaction) => void;
  onClose: () => void;
}

const DOW_VI = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const EXPANDED_KEY = 'day-detail-expanded';
const HALF_HEIGHT = '52dvh';
const FULL_HEIGHT = '92dvh';

function isSameDay(iso: string, target: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
}

export function DayDetailSheet({
  date,
  transactions,
  filterType = 'all',
  debts = [],
  onEdit,
  onClose,
}: DayDetailSheetProps) {
  const { customSources, customBudgets } = useAppStore();
  const open = date !== null;

  const [expanded, setExpanded] = useState(false);

  // Restore from localStorage on mount (client only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EXPANDED_KEY);
      if (saved === '1') setExpanded(true);
    } catch { /* ignore */ }
  }, []);

  // Persist whenever expanded changes
  useEffect(() => {
    try { localStorage.setItem(EXPANDED_KEY, expanded ? '1' : '0'); } catch { /* ignore */ }
  }, [expanded]);

  // Drag state for handle
  const dragRef = useRef<{ startY: number; startExpanded: boolean } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startY: e.clientY, startExpanded: expanded };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = e.clientY - dragRef.current.startY;
    // dy > 40 = kéo xuống → thu nhỏ; dy < -40 = kéo lên → mở rộng
    if (dy < -40 && !dragRef.current.startExpanded) {
      setExpanded(true);
      dragRef.current.startExpanded = true;
      dragRef.current.startY = e.clientY;
    } else if (dy > 40 && dragRef.current.startExpanded) {
      setExpanded(false);
      dragRef.current.startExpanded = false;
      dragRef.current.startY = e.clientY;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = e.clientY - dragRef.current.startY;
    // Nếu là click thuần (không kéo) → toggle
    if (Math.abs(dy) < 4) {
      setExpanded(v => !v);
    }
    dragRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  const dayTxs = useMemo(() => {
    if (!date) return [];
    return transactions
      .filter(tx => isSameDay(tx.date, date))
      .filter(tx => filterType === 'all' || tx.type === filterType)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [date, transactions, filterType]);

  const dayDebts = useMemo(() => {
    if (!date) return [];
    return debts.filter(d => d.dueDate && isSameDay(d.dueDate, date));
  }, [date, debts]);

  const totalIncome = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleTxClick = (tx: Transaction) => {
    if (!onEdit) return;
    onEdit(tx);
    onClose();
  };

  const dateLabel = date
    ? `${DOW_VI[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
    : '';

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-2xl gap-0 flex flex-col p-0 transition-[max-height,height] duration-300 ease-out"
        style={{
          background: 'var(--background)',
          maxHeight: expanded ? FULL_HEIGHT : HALF_HEIGHT,
          height: expanded ? FULL_HEIGHT : HALF_HEIGHT,
        }}
      >
        {/* Drag handle — touch/click to toggle, drag up/down for snap */}
        <div
          className="shrink-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { dragRef.current = null; }}
          role="button"
          aria-label={expanded ? 'Thu nhỏ' : 'Mở rộng'}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <SheetHeader className="shrink-0 px-5 pt-1 pb-4 gap-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <SheetTitle className="text-[15px] font-semibold text-left leading-tight" style={{ color: 'var(--foreground)' }}>
            {dateLabel}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Chi tiết giao dịch ngày {dateLabel}
          </SheetDescription>

          {(totalIncome > 0 || totalExpense > 0) && (
            <div className="flex gap-2.5 mt-3">
              {(filterType === 'all' || filterType === 'income') && totalIncome > 0 && (
                <div className="flex-1 flex flex-col gap-1 p-3 rounded-xl"
                  style={{ background: 'var(--primary-soft)' }}>
                  <span className="text-[11px] font-semibold uppercase tracking-wide leading-none" style={{ color: 'var(--muted-foreground)' }}>Thu</span>
                  <p className="text-sm font-bold amount leading-none" style={{ color: 'var(--income)' }}>+{formatVND(totalIncome)}</p>
                </div>
              )}
              {(filterType === 'all' || filterType === 'expense') && totalExpense > 0 && (
                <div className="flex-1 flex flex-col gap-1 p-3 rounded-xl"
                  style={{ background: 'hsl(0, 65%, 96%)' }}>
                  <span className="text-[11px] font-semibold uppercase tracking-wide leading-none" style={{ color: 'var(--muted-foreground)' }}>Chi</span>
                  <p className="text-sm font-bold amount leading-none" style={{ color: 'var(--expense)' }}>-{formatVND(totalExpense)}</p>
                </div>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {dayTxs.length === 0 && dayDebts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2"
              style={{ color: 'var(--muted-foreground)' }}>
              <Inbox size={32} />
              <p className="text-sm">Không có giao dịch trong ngày này</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {dayTxs.map(tx => {
                const isIncome = tx.type === 'income';
                const sourceLabel = resolveSourceLabel(tx.source, customSources);
                const goalLabel = resolveGoalLabel(tx.goal, customBudgets);
                const hasGoal = tx.goal && tx.goal !== 'none';

                return (
                  <button
                    key={tx.id}
                    onClick={() => handleTxClick(tx)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors hover:bg-[var(--muted)]"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center justify-center rounded-xl shrink-0"
                      style={{ width: 36, height: 36, background: isIncome ? 'var(--primary-soft)' : 'hsl(0, 65%, 96%)' }}>
                      {isIncome
                        ? <ArrowDownLeft size={16} style={{ color: 'var(--primary)' }} />
                        : <ArrowUpRight size={16} style={{ color: 'var(--expense)' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                          {tx.title}
                        </p>
                        <p className="text-sm font-semibold amount shrink-0"
                          style={{ color: isIncome ? 'var(--income)' : 'var(--expense)' }}>
                          {isIncome ? '+' : '-'}{formatVND(tx.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[12px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                          {sourceLabel}
                        </span>
                        {hasGoal && (
                          <span className="text-[12px] px-1.5 py-0.5 rounded font-medium"
                            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                            {goalLabel}
                          </span>
                        )}
                      </div>
                      {tx.note && (
                        <p className="text-[13px] mt-1 line-clamp-1" style={{ color: 'var(--muted-foreground)' }}>
                          {tx.note}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}

              {dayDebts.length > 0 && (
                <>
                  {dayTxs.length > 0 && <p className="text-overline mt-3">Nợ đến hạn</p>}
                  {dayDebts.map(debt => (
                    <div key={debt.id} className="w-full flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-center rounded-xl shrink-0"
                        style={{ width: 36, height: 36, background: 'hsl(0, 65%, 96%)' }}>
                        <Handshake size={16} style={{ color: 'var(--expense)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                            {debt.type === 'owe' ? 'Nợ' : 'Cho vay'} · {debt.person}
                          </p>
                          <p className="text-sm font-semibold amount shrink-0" style={{ color: 'var(--expense)' }}>
                            {formatVND(debt.amount)}
                          </p>
                        </div>
                        {debt.note && (
                          <p className="text-[13px] mt-1 line-clamp-1" style={{ color: 'var(--muted-foreground)' }}>
                            {debt.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
