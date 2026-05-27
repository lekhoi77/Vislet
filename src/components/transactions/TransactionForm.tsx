'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDraggableSheet } from '@/lib/use-draggable-sheet';
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
import { Transaction, TransactionSource, TransactionCategory, TransactionType } from '@/lib/types';
import { Building2, Wallet, Smartphone, PiggyBank, Plane, Clock, TrendingUp, TrendingDown, ArrowRight, CircleDot, Tag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatVND } from '@/lib/format';
import { CategoryIcon } from '@/lib/icons';

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

const BUILT_IN_CATEGORIES: { value: TransactionCategory; label: string; icon?: React.ReactNode }[] = [
  { value: 'none', label: 'Không phân loại', icon: <Tag size={14} /> },
  { value: 'saving', label: 'Tiết kiệm', icon: <PiggyBank size={14} /> },
  { value: 'travel', label: 'Du lịch', icon: <Plane size={14} /> },
  { value: 'soon', label: 'Sắp dùng', icon: <Clock size={14} /> },
];

function SelectGroup<T extends string>({
  options,
  value,
  onChange,
  accent = 'primary',
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  accent?: 'primary' | 'orange';
}) {
  const selectedBorder = accent === 'orange' ? 'var(--orange-muted)' : 'var(--primary-muted)';
  const selectedBg    = accent === 'orange' ? 'var(--orange-soft)'  : 'var(--primary-soft)';
  const selectedColor = accent === 'orange' ? 'var(--orange)'       : 'var(--foreground)';

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
            border: value === o.value ? `1px solid ${selectedBorder}` : '1px solid var(--border)',
            background: value === o.value ? selectedBg : 'transparent',
            color: value === o.value ? selectedColor : 'var(--muted-foreground)',
          }}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

import { UserSearchPicker, PickedDebtor } from '@/components/shared/UserSearchPicker';
import { Users } from 'lucide-react';

export function TransactionForm({ open, type, editingTx, onClose }: TransactionFormProps) {
  const { addTransaction, updateTransaction, createSharedDebt, transactions, customSources, customCategories } = useAppStore();

  const SOURCES = [
    ...BUILT_IN_SOURCES,
    ...customSources.map(s => ({ value: s.id, label: s.label, icon: <CircleDot size={15} /> })),
  ];

  const CATEGORIES = [
    ...BUILT_IN_CATEGORIES,
    ...customCategories.map(c => ({ value: c.id, label: c.label, icon: <CategoryIcon name={c.icon} size={14} /> })),
  ];

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [source, setSource] = useState<TransactionSource>('bank');
  const [category, setCategory] = useState<TransactionCategory>('none');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Split cost (only for expense)
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitDebtor, setSplitDebtor] = useState<PickedDebtor | null>(null);
  const [splitAmount, setSplitAmount] = useState<number>(0);
  const [splitDueDate, setSplitDueDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (editingTx) {
        setTitle(editingTx.title);
        setAmount(editingTx.amount);
        setSource(editingTx.source);
        setCategory(editingTx.category);
        setNote(editingTx.note);
        setDate(new Date(editingTx.date).toISOString().slice(0, 10));
      } else {
        setTitle('');
        setAmount(0);
        setSource('bank');
        setCategory('none');
        setNote('');
        setDate(todayStr);
      }
      setSplitEnabled(false);
      setSplitDebtor(null);
      setSplitAmount(0);
      setSplitDueDate('');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open, editingTx]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Vui lòng nhập nội dung';
    if (title.trim().length > 100) e.title = 'Tối đa 100 ký tự';
    if (amount <= 0) e.amount = 'Vui lòng nhập số tiền hợp lệ';
    if (amount > 999_999_999_999) e.amount = 'Số tiền vượt quá giới hạn';
    if (note.length > 500) e.note = 'Ghi chú tối đa 500 ký tự';
    if (splitEnabled) {
      if (!splitDebtor) e.split = 'Chọn người nợ bạn';
      if (splitAmount <= 0) e.splitAmount = 'Nhập số tiền họ nợ';
      if (splitAmount > amount) e.splitAmount = 'Không thể lớn hơn tổng chi tiêu';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    if (!validate()) return;
    setIsSubmitting(true);
    const txData = {
      type,
      title: title.trim(),
      amount,
      source,
      category,
      note: note.trim(),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
    };
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, txData);
        toast.success('Đã cập nhật giao dịch');
      } else {
        const created = await addTransaction(txData);
        // Nếu bật chia chi phí: tạo SharedDebt liên kết
        if (splitEnabled && splitDebtor && splitAmount > 0) {
          await createSharedDebt({
            sourceTransactionId: created.id,
            totalExpense: amount,
            debtAmount: splitAmount,
            debtorType: splitDebtor.type,
            debtorUserId: splitDebtor.userId,
            debtorProfileId: splitDebtor.profileId,
            debtorName: splitDebtor.name,
            debtorEmail: splitDebtor.email,
            direction: 'forward',
            note: title.trim() || note.trim(),
            category,
            dueDate: splitDueDate ? new Date(splitDueDate).toISOString() : null,
          });
          toast.success(splitDebtor.type === 'linked'
            ? 'Đã lưu chi tiêu, đã gửi yêu cầu nợ'
            : 'Đã lưu chi tiêu kèm khoản nợ');
        } else {
          toast.success(type === 'income' ? 'Đã lưu thu nhập' : 'Đã lưu chi tiêu');
        }
      }
      onClose();
    } catch (err) {
      toast.error(`Lỗi: ${(err as Error).message ?? 'Không thể lưu giao dịch'}`);
      setIsSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, title, amount, source, category, note, date, editingTx, onClose, splitEnabled, splitDebtor, splitAmount, splitDueDate, isSubmitting]);

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

  // Drag-to-expand sheet height (mặc định: full vì form có nhiều field)
  const { expanded, sheetStyle, handleProps } = useDraggableSheet('tx-form-expanded', true);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
       
        side="bottom"
        className="rounded-t-2xl gap-0 flex flex-col"
        style={{ padding: 0, background: 'var(--background)', ...sheetStyle }}
      >
        {/* Fixed header */}
        <div className="shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Drag handle */}
          <div
            {...handleProps}
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
            role="button"
            aria-label={expanded ? 'Thu nhỏ' : 'Mở rộng'}
          >
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
          <div className="px-5 pb-3">
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
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          style={!isIncome ? { '--ring': 'hsl(24, 90%, 58%)', '--ring-opacity': '0.4' } as React.CSSProperties : undefined}
        >
          <div className="flex flex-col gap-5">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Nội dung *
              </Label>
              <Input
                id="tx-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={isIncome ? 'VD: Lương tháng 5...' : 'VD: Cà phê Highlands...'}
                maxLength={100}
                className={errors.title ? 'border-[var(--destructive)]' : ''}
              />
              {errors.title && (
                <p className="text-sm" style={{ color: 'var(--destructive)' }}>{errors.title}</p>
              )}
            </div>

            {/* Amount */}
            <AmountInput value={amount} onChange={setAmount} type={type} error={errors.amount} />

            {/* Date */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-date" className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
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
              <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Nguồn tiền *
              </Label>
              <SelectGroup options={SOURCES} value={source} onChange={setSource} accent={isIncome ? 'primary' : 'orange'} />
              {sourcePreview && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  <span>{SOURCES.find(s => s.value === source)?.label ?? source}</span>
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{formatVND(sourcePreview.current)}</span>
                  <ArrowRight size={12} />
                  <span className="font-semibold" style={{ color: sourcePreview.next >= 0 ? 'var(--foreground)' : 'var(--down)' }}>
                    {formatVND(Math.abs(sourcePreview.next))}{sourcePreview.next < 0 ? ' (âm)' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Category - expense only */}
            {!isIncome && (
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                  Danh mục
                </Label>
                <SelectGroup options={CATEGORIES} value={category} onChange={setCategory} accent="orange" />
              </div>
            )}

            {/* Note */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Ghi chú (tuỳ chọn)
              </Label>
              <Textarea
                id="tx-note"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Thêm ghi chú..."
                maxLength={500}
                rows={2}
                className={errors.note ? 'border-[var(--destructive)]' : ''}
              />
              {errors.note && (
                <p className="text-sm" style={{ color: 'var(--destructive)' }}>{errors.note}</p>
              )}
            </div>

            {/* Split cost — only for expense, new transaction */}
            {!isIncome && !editingTx && (
              <div className="flex flex-col gap-3 p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Users size={15} style={{ color: 'var(--foreground)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      Chia chi phí với người khác
                    </span>
                  </div>
                  <span
                    role="switch"
                    aria-checked={splitEnabled}
                    onClick={() => setSplitEnabled(v => !v)}
                    className="relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors"
                    style={{
                      width: 36, height: 20,
                      background: splitEnabled ? 'var(--primary)' : 'var(--border)',
                    }}
                  >
                    <span
                      className="inline-block rounded-full bg-white shadow transition-transform"
                      style={{ width: 16, height: 16, marginTop: 2, marginLeft: 2, transform: splitEnabled ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </span>
                </label>

                {splitEnabled && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                        Người nợ bạn *
                      </Label>
                      <UserSearchPicker value={splitDebtor} onChange={setSplitDebtor} />
                      {errors.split && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{errors.split}</p>}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                        Số tiền họ nợ *
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={splitAmount === 0 ? '' : new Intl.NumberFormat('vi-VN').format(splitAmount)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setSplitAmount(parseInt(raw || '0', 10));
                          }}
                          placeholder="0"
                          className={`pr-16 text-base font-semibold ${errors.splitAmount ? 'border-[var(--destructive)]' : ''}`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>VNĐ</span>
                      </div>
                      {/* Gợi ý chia */}
                      {amount > 0 && (() => {
                        const presets = [
                          { label: 'Chia đôi', value: Math.floor(amount / 2) },
                          { label: 'Chia 3',   value: Math.floor(amount / 3) },
                          { label: 'Chia 4',   value: Math.floor(amount / 4) },
                          { label: 'Họ trả hết', value: amount },
                        ];
                        return (
                          <div className="flex gap-2 flex-wrap">
                            {presets.map(p => {
                              const isActive = splitAmount === p.value && splitAmount > 0;
                              return (
                                <button
                                  key={p.label}
                                  type="button"
                                  onClick={() => setSplitAmount(p.value)}
                                  className="text-[12px] px-2 py-1 rounded-md font-medium transition-colors"
                                  style={{
                                    background: isActive ? 'var(--primary-soft)' : 'var(--background)',
                                    color: isActive ? 'var(--primary)' : 'var(--foreground)',
                                    border: `1px solid ${isActive ? 'var(--primary-muted)' : 'var(--border)'}`,
                                  }}
                                >
                                  {p.label}: {p.value.toLocaleString('vi-VN')}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                      {errors.splitAmount && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{errors.splitAmount}</p>}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                        Hạn trả (tuỳ chọn)
                      </Label>
                      <Input type="date" value={splitDueDate} onChange={e => setSplitDueDate(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fixed footer */}
        <div className="shrink-0 px-5 pt-3 pb-8" style={{ borderTop: '1px solid var(--border)' }}>
          <Button
            id="tx-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: isIncome ? 'var(--primary)' : 'var(--orange)',
              color: isIncome ? 'var(--primary-foreground)' : 'var(--orange-foreground)',
            }}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting
              ? 'ĐANG LƯU...'
              : editingTx
                ? (isIncome ? 'CẬP NHẬT THU NHẬP' : 'CẬP NHẬT CHI TIÊU')
                : (isIncome ? 'LƯU THU NHẬP' : 'LƯU CHI TIÊU')
            }
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
