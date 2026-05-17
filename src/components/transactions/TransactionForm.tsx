'use client';

import { useState, useEffect } from 'react';
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
import { Building2, Wallet, Smartphone, PiggyBank, Plane, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  open: boolean;
  type: TransactionType;
  editingTx?: Transaction | null;
  onClose: () => void;
}

const SOURCES: { value: TransactionSource; label: string; icon: React.ReactNode }[] = [
  { value: 'bank', label: 'Ngân hàng', icon: <Building2 size={15} /> },
  { value: 'cash', label: 'Tiền mặt', icon: <Wallet size={15} /> },
  { value: 'momo', label: 'MoMo', icon: <Smartphone size={15} /> },
];

const GOALS: { value: TransactionGoal; label: string; icon?: React.ReactNode }[] = [
  { value: 'none', label: 'Không phân loại' },
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
  const { addTransaction, updateTransaction } = useAppStore();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [source, setSource] = useState<TransactionSource>('bank');
  const [goal, setGoal] = useState<TransactionGoal>('none');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editingTx) {
        setTitle(editingTx.title);
        setAmount(editingTx.amount);
        setSource(editingTx.source);
        setGoal(editingTx.goal);
        setNote(editingTx.note);
      } else {
        setTitle('');
        setAmount(0);
        setSource('bank');
        setGoal('none');
        setNote('');
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

  const handleSubmit = () => {
    if (!validate()) return;
    const txData = {
      type,
      title: title.trim(),
      amount,
      source,
      goal,
      note: note.trim(),
      date: new Date().toISOString(),
    };
    if (editingTx) {
      updateTransaction(editingTx.id, txData);
      toast.success('Đã cập nhật giao dịch');
    } else {
      addTransaction(txData);
      toast.success(type === 'income' ? 'Đã lưu thu nhập' : 'Đã lưu chi tiêu');
    }
    onClose();
  };

  const isIncome = type === 'income';
  const titleStr = editingTx
    ? (isIncome ? 'Sửa thu nhập' : 'Sửa chi tiêu')
    : (isIncome ? 'Thêm thu nhập' : 'Thêm chi tiêu');

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[92dvh] overflow-y-auto"
        style={{ padding: '24px 20px 48px', background: 'var(--background)' }}
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-[var(--border)] mb-5" />
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-semibold text-left" style={{ color: 'var(--foreground)' }}>
            {titleStr}
          </SheetTitle>
        </SheetHeader>

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

          {/* Source */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Nguồn tiền *
            </Label>
            <SelectGroup options={SOURCES} value={source} onChange={setSource} />
          </div>

          {/* Goal */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Mục tiêu
            </Label>
            <SelectGroup options={GOALS} value={goal} onChange={setGoal} />
          </div>

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

          {/* Submit */}
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
