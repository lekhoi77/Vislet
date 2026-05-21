'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDraggableSheet } from '@/lib/use-draggable-sheet';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AmountInput } from '@/components/shared/AmountInput';
import { useAppStore } from '@/store/app-store';
import { Debt, DebtType } from '@/lib/types';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

interface DebtFormProps {
  open: boolean;
  onClose: () => void;
  editingDebt?: Debt | null;
}

export function DebtForm({ open, onClose, editingDebt }: DebtFormProps) {
  const { addDebt, updateDebt } = useAppStore();
  const [type, setType] = useState<DebtType>('owe');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editingDebt) {
        setType(editingDebt.type);
        setPerson(editingDebt.person);
        setAmount(editingDebt.amount);
        setDueDate(editingDebt.dueDate?.split('T')[0] ?? '');
        setNote(editingDebt.note);
      } else {
        setType('owe');
        setPerson('');
        setAmount(0);
        setDueDate('');
        setNote('');
      }
      setErrors({});
    }
  }, [open, editingDebt]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!person.trim()) e.person = 'Vui lòng nhập tên người';
    if (amount <= 0) e.amount = 'Vui lòng nhập số tiền hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    const data = {
      type,
      person: person.trim(),
      amount,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      note: note.trim(),
    };
    if (editingDebt) {
      updateDebt(editingDebt.id, data);
      toast.success('Đã cập nhật khoản nợ');
    } else {
      addDebt(data);
      toast.success('Đã lưu khoản nợ');
    }
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, person, amount, dueDate, note, editingDebt, onClose]);

  // Enter = submit (trừ khi đang gõ trong textarea)
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA') return;
      e.preventDefault();
      handleSubmitRef.current();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const { expanded, sheetStyle, handleProps } = useDraggableSheet('debt-form-expanded', true);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        showCloseButton={false}
        side="bottom"
        className="rounded-t-2xl overflow-y-auto"
        style={{ padding: 0, background: 'var(--background)', ...sheetStyle }}
      >
        <div
          {...handleProps}
          className="sticky top-0 z-10 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
          style={{ background: 'var(--background)' }}
          role="button"
          aria-label={expanded ? 'Thu nhỏ' : 'Mở rộng'}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
        <div className="px-5 pb-12">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-semibold text-left" style={{ color: 'var(--foreground)' }}>
            {editingDebt ? 'Sửa khoản nợ' : 'Ghi nợ mới'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5">
          {/* Type */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Loại *
            </Label>
            <div className="flex gap-2">
              {([
                { value: 'owe' as DebtType, label: 'Tôi nợ' },
                { value: 'lend' as DebtType, label: 'Họ nợ tôi' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className="flex-1 h-11 rounded-xl text-sm font-medium transition-all"
                  id={`debt-type-${opt.value}`}
                  style={{
                    border: type === opt.value ? '1px solid var(--primary-muted)' : '1px solid var(--border)',
                    background: type === opt.value ? 'var(--primary-soft)' : 'transparent',
                    color: type === opt.value ? 'var(--foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Person */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Tên người *
            </Label>
            <Input
              id="debt-person"
              value={person}
              onChange={e => setPerson(e.target.value)}
              placeholder="VD: Minh, Lan..."
              className={errors.person ? 'border-[var(--expense)]' : ''}
            />
            {errors.person && <p className="text-sm" style={{ color: 'var(--expense)' }}>{errors.person}</p>}
          </div>

          {/* Amount */}
          <AmountInput
            value={amount}
            onChange={setAmount}
            type={type === 'owe' ? 'expense' : 'income'}
            error={errors.amount}
          />

          {/* Due date */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Ngày hẹn trả (tuỳ chọn)
            </Label>
            <div className="relative">
              <Input
                id="debt-due"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="pr-10"
              />
              <Calendar size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Ghi chú (tuỳ chọn)
            </Label>
            <Textarea
              id="debt-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Thêm ghi chú..."
              rows={2}
            />
          </div>

          <Button
            id="debt-submit"
            onClick={handleSubmit}
            className="w-full h-12 rounded-xl text-sm font-semibold tracking-wide"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {editingDebt ? 'CẬP NHẬT KHOẢN NỢ' : 'LƯU KHOẢN NỢ'}
          </Button>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
