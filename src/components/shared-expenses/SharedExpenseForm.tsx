'use client';

import { useState, useEffect } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/app-store';
import { UserSearchPicker, PickedParticipant } from '@/components/shared/UserSearchPicker';
import { toast } from 'sonner';

interface SharedExpenseFormProps {
  open: boolean;
  onClose: () => void;
}

type Direction = 'forward' | 'reverse';

export function SharedExpenseForm({ open, onClose }: SharedExpenseFormProps) {
  const { createSharedExpense } = useAppStore();

  const [direction, setDirection] = useState<Direction>('forward'); // forward: họ cần trả tôi
  const [participant, setParticipant] = useState<PickedParticipant | null>(null);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDirection('forward');
      setParticipant(null);
      setAmount(0);
      setNote('');
      setDueDate('');
    }
  }, [open]);

  const submit = async () => {
    if (!participant) { toast.error('Chọn người'); return; }
    if (amount <= 0) { toast.error('Nhập số tiền'); return; }
    setSubmitting(true);
    try {
      await createSharedExpense({
        sourceTransactionId: null,
        totalExpense: amount,
        splitAmount: amount,
        participantType: participant.type,
        participantUserId: participant.userId,
        participantProfileId: participant.profileId,
        participantName: participant.name,
        participantEmail: participant.email,
        direction,
        note: note.trim(),
        category: 'none',
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      toast.success(participant.type === 'linked' ? 'Đã gửi yêu cầu' : 'Đã ghi chi chung');
      onClose();
    } catch (err) {
      toast.error(`Lỗi: ${(err as Error).message ?? 'Không thể tạo khoản chi chung'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl gap-0 flex flex-col p-0"
        style={{ background: 'var(--background)' }}>
        <div className="shrink-0 flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
        <SheetHeader className="px-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <SheetTitle className="text-base font-semibold text-left">Ghi chi chung</SheetTitle>
        </SheetHeader>

        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          {/* Direction toggle */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setDirection('forward')}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: direction === 'forward' ? 'var(--primary)' : 'var(--muted)',
                color: direction === 'forward' ? '#fff' : 'var(--muted-foreground)',
              }}>
              Họ cần trả tôi
            </button>
            <button type="button" onClick={() => setDirection('reverse')}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: direction === 'reverse' ? 'var(--orange)' : 'var(--muted)',
                color: direction === 'reverse' ? '#fff' : 'var(--muted-foreground)',
              }}>
              Tôi cần trả họ
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>
              {direction === 'forward' ? 'Người cùng chia *' : 'Bạn chia với ai *'}
            </Label>
            <UserSearchPicker value={participant} onChange={setParticipant} />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Số tiền *</Label>
            <div className="relative">
              <Input type="text" inputMode="numeric"
                value={amount === 0 ? '' : new Intl.NumberFormat('vi-VN').format(amount)}
                onChange={e => setAmount(parseInt(e.target.value.replace(/\D/g, '') || '0', 10))}
                placeholder="0"
                className="pr-16 text-base font-semibold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted-foreground)' }}>VNĐ</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Ghi chú (tuỳ chọn)</Label>
            <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="VD: Bữa ăn tối..." maxLength={200} />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Hạn trả (tuỳ chọn)</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="px-5 pt-3 pb-8" style={{ borderTop: '1px solid var(--border)' }}>
          <Button disabled={submitting} onClick={submit}
            className="w-full h-12 rounded-xl text-sm font-semibold tracking-wide"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            {submitting ? 'Đang lưu…' : 'LƯU'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
