'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AmountInput } from '@/components/shared/AmountInput';
import { useAppStore } from '@/store/app-store';
import { Transaction, TransactionSource, TransactionGoal, TransactionType } from '@/lib/types';
import { Building2, Wallet, Smartphone, PiggyBank, Plane, Clock, TrendingUp, TrendingDown, ArrowRight, CircleDot, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatVND } from '@/lib/format';
import { BudgetIcon } from '@/lib/icons';

interface TransactionFormProps {
  open: boolean;
  type: TransactionType;
  editingTx?: Transaction | null;
  onClose: () => void;
}

const BUILT_IN_SOURCES: { value: TransactionSource; label: string; icon: React.ReactNode }[] = [
  { value: 'bank', label: 'Ngân hàng', icon: <Building2 size={15} /> },
  { value: 'cash', label: 'Tiền mặt', icon: <Wallet size={15} /> },
  { value: 'momo', label: 'MoMo', icon: <Smartphone size={15} /> },
];

const BUILT_IN_GOALS: { value: TransactionGoal; label: string; icon?: React.ReactNode }[] = [
  { value: 'none', label: 'Không phân loại', icon: <Tag size={14} /> },
  { value: 'saving', label: 'Tiết kiệm', icon: <PiggyBank size={14} /> },
  { value: 'travel', label: 'Du lịch', icon: <Plane size={14} /> },
  { value: 'soon', label: 'Sắp dùng', icon: <Clock size={14} /> },
];

function SelectGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
          )}
          style={{
            border: value === o.value ? '1px solid var(--primary-muted)' : '1px solid var(--border)',
            background: value === o.value ? 'var(--primary-soft)' : 'transparent',
            color: value === o.value ? 'var(--foreground)' : 'var(--muted-foreground)',
          }}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TransactionForm({ open, type, editingTx, onClose }: TransactionFormProps) {
  const { addTransaction, updateTransaction, transactions, customSources, customBudgets } = useAppStore();

  const SOURCES = [
    ...BUILT_IN_SOURCES,
    ...customSources.map(s => ({ value: s.id, label: s.label, icon: <CircleDot size={15} /> })),
  ];

  const GOALS = [
    ...BUILT_IN_GOALS,
    ...customBudgets.map(b => ({ value: b.id, label: b.label, icon: <BudgetIcon name={b.icon} size={14} /> })),
  ];

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [source, setSource] = useState<TransactionSource>('bank');
  const [goal, setGoal] = useState<TransactionGoal>('none');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (editingTx) {
        setTitle(editingTx.title);
        setAmount(editingTx.amount);
        setSource(editingTx.source);
        setGoal(editingTx.goal);
        setNote(editingTx.note);
        setDate(new Date(editingTx.date).toISOString().slice(0, 10));
      } else {
        setTitle('');
        setAmount(0);
        setSource('bank');
        setGoal('none');
        setNote('');
        setDate(todayStr);
      }
      setErrors({});
    }
  }, [open, editingTx]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Vui lòng nhập nội dung';
    if (title.trim().length > 100) e.title = 'Tối đa 100 ký tự';
    if (amount <= 0) e.amount = 'Vui lòng nhập số tiền hợp lệ';
    if (amount > 999_999_999_999) e.amount = 'Số tiền vượt quá giới hạn';
    if (note.length > 500) e.note = 'Ghi chú tối đa 500 ký tự';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    const txData = {
      type,
      title: title.trim(),
      amount,
      source,
      goal,
      note: note.trim(),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
    };
    if (editingTx) {
      updateTransaction(editingTx.id, txData);
      toast.success('Đã cập nhật giao dịch');
    } else {
      addTransaction(txData);
      toast.success(type === 'income' ? 'Đã lưu thu nhập' : 'Đã lưu chi tiêu');
    }
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, title, amount, source, goal, note, date, editingTx, onClose]);

  // Enter = submit (trừ khi đang gõ trong textarea)
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA') return; // Enter trong textarea = xuống dòng bình thường
      e.preventDefault();
      handleSubmitRef.current();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const isIncome = type === 'income';
  const titleStr = editingTx
    ? (isIncome ? 'Sửa thu nhập' : 'Sửa chi tiêu')
    : (isIncome ? 'Thêm thu nhập' : 'Thêm chi tiêu');

  // Source balance preview
  const getSourcePreview = () => {
    if (amount <= 0) return null;
    const base = transactions
      .filter(t => t.source === source && (!editingTx || t.id !== editingTx.id))
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
    const next = isIncome ? base + amount : base - amount;
    return { current: Math.max(0, base), next };
  };
  const sourcePreview = getSourcePreview();

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[92dvh] gap-0"
        style={{ padding: 0, background: 'var(--background)' }}
      >
        {/* Fixed header */}
        <div className="shrink-0 px-5 pt-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="mx-auto w-10 h-1 rounded-full bg-[var(--border)] mb-3" />
          <SheetHeader className="p-0">
            <SheetTitle className="text-base font-semibold text-left flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              {isIncome
                ? <TrendingUp size={18} style={{ color: 'var(--income)' }} />
                : <TrendingDown size={18} style={{ color: 'var(--expense)' }} />
              }
              {titleStr}
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-5">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Nội dung *
              </Label>
              <Input
                id="tx-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={isIncome ? 'VD: Lương tháng 5...' : 'VD: Cà phê Highlands...'}
                maxLength={100}
                className={errors.title ? 'border-[var(--expense)]' : ''}
              />
              {errors.title && (
                <p className="text-xs" style={{ color: 'var(--expense)' }}>{errors.title}</p>
              )}
            </div>

            {/* Amount */}
            <AmountInput value={amount} onChange={setAmount} type={type} error={errors.amount} />

            {/* Date */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-date" className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Ngày
              </Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>

            {/* Source */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Nguồn tiền *
              </Label>
              <SelectGroup options={SOURCES} value={source} onChange={setSource} />
              {sourcePreview && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  <span>{SOURCES.find(s => s.value === source)?.label ?? source}</span>
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{formatVND(sourcePreview.current)}</span>
                  <ArrowRight size={12} />
                  <span className="font-semibold" style={{ color: sourcePreview.next >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                    {formatVND(Math.abs(sourcePreview.next))}{sourcePreview.next < 0 ? ' (âm)' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Goal - expense only */}
            {!isIncome && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                  Mục tiêu
                </Label>
                <SelectGroup options={GOALS} value={goal} onChange={setGoal} />
              </div>
            )}

            {/* Note */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Ghi chú (tuỳ chọn)
              </Label>
              <Textarea
                id="tx-note"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Thêm ghi chú..."
                maxLength={500}
                rows={2}
                className={errors.note ? 'border-[var(--expense)]' : ''}
              />
              {errors.note && (
                <p className="text-xs" style={{ color: 'var(--expense)' }}>{errors.note}</p>
              )}
            </div>
          </div>
        </div>

        {/* Fixed footer */}
        <div className="shrink-0 px-5 pt-3 pb-8" style={{ borderTop: '1px solid var(--border)' }}>
          <Button
            id="tx-submit"
            onClick={handleSubmit}
            className="w-full h-12 rounded-xl text-sm font-semibold tracking-wide"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {editingTx
              ? (isIncome ? 'CẬP NHẬT THU NHẬP' : 'CẬP NHẬT CHI TIÊU')
              : (isIncome ? 'LƯU THU NHẬP' : 'LƯU CHI TIÊU')
            }
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
