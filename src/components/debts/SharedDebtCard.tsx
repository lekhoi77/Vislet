'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link2, User as UserIcon, Calendar, Trash2, X, Check, FileText, Building2, Wallet, Smartphone, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatVND, formatDate } from '@/lib/format';
import type { SharedDebt } from '@/lib/types';

interface Props {
  debt: SharedDebt;
  currentUserId: string;
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:          { label: 'Chờ xác nhận',     bg: 'hsl(40, 95%, 92%)', color: 'hsl(28, 90%, 38%)' },
  active:           { label: 'Đang nợ',          bg: 'var(--muted)',       color: 'var(--foreground)' },
  pending_confirm:  { label: 'Chờ xác nhận trả', bg: 'hsl(40, 95%, 92%)', color: 'hsl(28, 90%, 38%)' },
  settled:          { label: 'Đã xong',          bg: 'var(--primary-soft)', color: 'var(--primary)' },
  rejected:         { label: 'Bị từ chối',       bg: 'hsl(0, 65%, 95%)',   color: 'var(--destructive)' },
  cancelled:        { label: 'Đã huỷ',           bg: 'var(--muted)',       color: 'var(--muted-foreground)' },
};

export function SharedDebtCard({ debt, currentUserId }: Props) {
  const {
    cancelSharedDebt, deleteSharedDebt, acceptSharedDebt, rejectSharedDebt,
    claimPayment, confirmPayment, denyPayment, manualSettle,
  } = useAppStore();

  const isCreditor = debt.creditorUserId === currentUserId;
  const isDebtor = debt.debtorUserId === currentUserId;

  const [showDelete, setShowDelete] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showSettle, setShowSettle] = useState(false);

  const badge = STATUS_BADGE[debt.status];
  const remaining = debt.remainingAmount;
  const paidSoFar = debt.debtAmount - remaining;
  const progressPct = debt.debtAmount > 0 ? (paidSoFar / debt.debtAmount) * 100 : 0;

  const otherName = isCreditor ? debt.debtorName : debt.creditorName;
  const otherIsLinked = isCreditor ? debt.debtorType === 'linked' : true;

  // Direction display: isDebtor = "Tôi nợ" (đỏ/cam), isCreditor = "Cho vay" (xanh)
  const directionLabel = isDebtor ? 'Tôi nợ' : 'Cho vay';
  const directionColor = isDebtor ? 'var(--down)' : 'var(--primary)';
  const directionBg    = isDebtor ? 'hsl(0, 70%, 96%)' : 'var(--primary-soft)';
  const DirectionIcon  = isDebtor ? ArrowUpRight : ArrowDownLeft;
  const amountPrefix   = isDebtor ? '−' : '+';

  // Payment chưa confirm (chờ A confirm)
  const pendingPayment = debt.payments?.find(p => p.confirmedAt === null);

  return (
    <>
      <div
        className="flex flex-col gap-3 p-4 rounded-2xl"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderLeft: `3px solid ${directionColor}`,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Header: direction tag + status badge */}
        <div className="flex items-center justify-between gap-2">
          <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide"
            style={{ background: directionBg, color: directionColor }}
          >
            <DirectionIcon size={12} />
            {directionLabel}
          </div>
          {badge && (
            <Badge className="text-[11px] px-2 py-0.5 h-auto font-semibold border-0 shrink-0"
              style={{ background: badge.bg, color: badge.color }}>
              {badge.label}
            </Badge>
          )}
        </div>

        {/* Counterparty info */}
        <div className="flex items-center gap-2 min-w-0">
          <Avatar style={{ width: 36, height: 36 }}>
            <AvatarFallback style={{ background: otherIsLinked ? 'var(--primary)' : 'var(--muted-foreground)', color: '#fff', fontSize: 14, fontWeight: 700 }}>
              {otherName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {isDebtor ? 'Người cho vay' : 'Người vay'}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{otherName}</span>
              {otherIsLinked
                ? <Link2 size={11} style={{ color: 'var(--primary)' }} />
                : <UserIcon size={11} style={{ color: 'var(--muted-foreground)' }} />}
            </div>
          </div>
        </div>

        {/* Amount */}
        <p className="text-2xl font-bold amount" style={{ color: directionColor }}>
          {amountPrefix}{formatVND(remaining)}
        </p>
        {remaining < debt.debtAmount && (
          <div className="flex flex-col gap-1">
            <p className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
              Đã trả {formatVND(paidSoFar)} / {formatVND(debt.debtAmount)}
            </p>
            <div className="h-1.5 rounded-full" style={{ background: 'var(--muted)' }}>
              <div className="h-1.5 rounded-full" style={{ width: `${progressPct}%`, background: 'var(--primary)' }} />
            </div>
          </div>
        )}

        {/* Note + due date */}
        {debt.note && (
          <div className="flex items-center gap-1.5">
            <FileText size={12} style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-[13px] truncate" style={{ color: 'var(--muted-foreground)' }}>{debt.note}</p>
          </div>
        )}
        {debt.dueDate && (
          <div className="flex items-center gap-1.5">
            <Calendar size={12} style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-[13px]" style={{ color: 'var(--muted-foreground)' }}>Hạn: {formatDate(debt.dueDate)}</p>
          </div>
        )}

        {/* Pending payment info */}
        {pendingPayment && (
          <div className="flex flex-col gap-1 p-2 rounded-lg" style={{ background: 'hsl(40, 95%, 96%)', border: '1px solid hsl(40, 90%, 85%)' }}>
            <p className="text-[12px] font-medium" style={{ color: 'hsl(28, 90%, 38%)' }}>
              {isCreditor
                ? `${debt.debtorName} nói đã trả ${formatVND(pendingPayment.amount)}`
                : `Bạn đã báo trả ${formatVND(pendingPayment.amount)}, chờ ${debt.creditorName} xác nhận`}
            </p>
            {pendingPayment.note && (
              <p className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>&ldquo;{pendingPayment.note}&rdquo;</p>
            )}
          </div>
        )}

        {/* Rejected reason */}
        {debt.status === 'rejected' && debt.rejectReason && (
          <p className="text-[12px]" style={{ color: 'var(--destructive)' }}>
            Lý do: {debt.rejectReason}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {/* Creditor actions */}
          {isCreditor && debt.status === 'pending' && (
            <Button size="sm" variant="outline" className="h-9" onClick={() => { cancelSharedDebt(debt.id); toast.success('Đã huỷ yêu cầu'); }}>
              <X size={13} /> Huỷ yêu cầu
            </Button>
          )}
          {isCreditor && debt.status === 'pending_confirm' && pendingPayment && (
            <>
              <Button size="sm" className="flex-1 h-9 gap-1.5" style={{ background: 'var(--primary)', color: '#fff' }}
                onClick={async () => { await confirmPayment(pendingPayment.id); toast.success('Đã xác nhận nhận tiền'); }}>
                <Check size={13} /> Đã nhận
              </Button>
              <Button size="sm" variant="outline" className="h-9"
                onClick={async () => { await denyPayment(pendingPayment.id); toast.success('Đã báo chưa nhận được'); }}>
                <X size={13} /> Chưa nhận
              </Button>
            </>
          )}
          {isCreditor && debt.status === 'active' && debt.debtorType === 'unlinked' && (
            <Button size="sm" className="flex-1 h-9 gap-1.5" style={{ background: 'var(--primary)', color: '#fff' }}
              onClick={() => setShowSettle(true)}>
              <Check size={13} /> Đánh dấu đã nhận
            </Button>
          )}

          {/* Debtor actions (linked, B side) */}
          {isDebtor && debt.status === 'pending' && (
            <>
              <Button size="sm" className="flex-1 h-9 gap-1.5" style={{ background: 'var(--primary)', color: '#fff' }}
                onClick={async () => { await acceptSharedDebt(debt.id); toast.success('Đã xác nhận'); }}>
                <Check size={13} /> Xác nhận nợ
              </Button>
              <Button size="sm" variant="outline" className="h-9"
                onClick={async () => { await rejectSharedDebt(debt.id); toast.success('Đã từ chối'); }}>
                <X size={13} /> Từ chối
              </Button>
            </>
          )}
          {isDebtor && debt.status === 'active' && (
            <Button size="sm" className="flex-1 h-9 gap-1.5" style={{ background: 'var(--primary)', color: '#fff' }}
              onClick={() => setShowClaim(true)}>
              Đã trả →
            </Button>
          )}

          {/* Delete (creditor only, for non-active states) */}
          {isCreditor && (debt.status === 'rejected' || debt.status === 'cancelled' || debt.status === 'settled') && (
            <Button size="sm" variant="outline" className="h-9 w-9 p-0 ml-auto"
              style={{ color: 'var(--destructive)' }}
              onClick={() => setShowDelete(true)}
              aria-label="Xoá">
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </div>

      {/* Claim payment sheet (B) */}
      <ClaimPaymentSheet
        open={showClaim}
        onClose={() => setShowClaim(false)}
        debt={debt}
        onConfirm={async (amt, src, note) => {
          await claimPayment(debt.id, amt, src, note);
          toast.success(`Đã gửi xác nhận trả cho ${debt.creditorName}`);
          setShowClaim(false);
        }}
      />

      {/* Manual settle sheet (A, unlinked) */}
      <ManualSettleSheet
        open={showSettle}
        onClose={() => setShowSettle(false)}
        debt={debt}
        onConfirm={async (amt, src, note) => {
          await manualSettle(debt.id, amt, src, note);
          toast.success('Đã ghi nhận khoản thu');
          setShowSettle(false);
        }}
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá khoản nợ?</AlertDialogTitle>
            <AlertDialogDescription>
              Khoản nợ này sẽ bị xoá. Giao dịch chi tiêu gốc (nếu có) vẫn được giữ lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteSharedDebt(debt.id)}
              style={{ background: 'var(--destructive)', color: '#fff' }}>
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Claim Payment Sheet ─────────────────────────────────
function ClaimPaymentSheet({ open, onClose, debt, onConfirm }: {
  open: boolean; onClose: () => void; debt: SharedDebt;
  onConfirm: (amount: number, source: string, note: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(debt.remainingAmount);
  const [source, setSource] = useState('bank');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (amount <= 0 || amount > debt.remainingAmount) {
      toast.error('Số tiền không hợp lệ'); return;
    }
    setSubmitting(true);
    try { await onConfirm(amount, source, note); } finally { setSubmitting(false); }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl gap-0 flex flex-col p-0"
        style={{ background: 'var(--background)' }}>
        <div className="shrink-0 flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
        <SheetHeader className="px-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <SheetTitle className="text-base font-semibold text-left">💸 Xác nhận đã trả</SheetTitle>
          <SheetDescription className="text-sm text-left" style={{ color: 'var(--muted-foreground)' }}>
            Trả cho: <b style={{ color: 'var(--foreground)' }}>{debt.creditorName}</b><br />
            Số tiền còn nợ: <b style={{ color: 'var(--foreground)' }}>{formatVND(debt.remainingAmount)}</b>
          </SheetDescription>
        </SheetHeader>
        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Số tiền trả lần này</Label>
            <div className="relative">
              <Input type="text" inputMode="numeric"
                value={amount === 0 ? '' : new Intl.NumberFormat('vi-VN').format(amount)}
                onChange={e => setAmount(parseInt(e.target.value.replace(/\D/g, '') || '0', 10))}
                className="pr-16 text-base font-semibold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted-foreground)' }}>VNĐ</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Nguồn tiền trả *</Label>
            <div className="flex gap-2 flex-wrap">
              {[
                { v: 'bank', label: 'Ngân hàng', icon: <Building2 size={14} /> },
                { v: 'cash', label: 'Tiền mặt', icon: <Wallet size={14} /> },
                { v: 'momo', label: 'MoMo', icon: <Smartphone size={14} /> },
              ].map(o => (
                <button key={o.v} type="button" onClick={() => setSource(o.v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    border: source === o.v ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: source === o.v ? 'var(--primary-soft)' : 'transparent',
                    color: source === o.v ? 'var(--primary)' : 'var(--muted-foreground)',
                  }}>
                  {o.icon}{o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Ghi chú cho {debt.creditorName} (tuỳ chọn)</Label>
            <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
              placeholder='VD: "Đã chuyển khoản rồi nha"' maxLength={200} />
          </div>
        </div>
        <div className="px-5 pt-3 pb-8" style={{ borderTop: '1px solid var(--border)' }}>
          <Button disabled={submitting} onClick={submit}
            className="w-full h-12 rounded-xl text-sm font-semibold tracking-wide"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            {submitting ? 'Đang gửi…' : `GỬI XÁC NHẬN CHO ${debt.creditorName.toUpperCase()}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Manual settle sheet (A, unlinked) ───────────────────
function ManualSettleSheet({ open, onClose, debt, onConfirm }: {
  open: boolean; onClose: () => void; debt: SharedDebt;
  onConfirm: (amount: number, source: string, note: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(debt.remainingAmount);
  const [source, setSource] = useState('bank');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (amount <= 0 || amount > debt.remainingAmount) { toast.error('Số tiền không hợp lệ'); return; }
    setSubmitting(true);
    try { await onConfirm(amount, source, note); } finally { setSubmitting(false); }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl gap-0 flex flex-col p-0"
        style={{ background: 'var(--background)' }}>
        <div className="shrink-0 flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
        <SheetHeader className="px-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <SheetTitle className="text-base font-semibold text-left">✓ Đánh dấu đã nhận</SheetTitle>
          <SheetDescription className="text-sm text-left" style={{ color: 'var(--muted-foreground)' }}>
            Nhận từ: <b style={{ color: 'var(--foreground)' }}>{debt.debtorName}</b><br />
            Còn lại: <b style={{ color: 'var(--foreground)' }}>{formatVND(debt.remainingAmount)}</b>
          </SheetDescription>
        </SheetHeader>
        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Số tiền nhận</Label>
            <div className="relative">
              <Input type="text" inputMode="numeric"
                value={amount === 0 ? '' : new Intl.NumberFormat('vi-VN').format(amount)}
                onChange={e => setAmount(parseInt(e.target.value.replace(/\D/g, '') || '0', 10))}
                className="pr-16 text-base font-semibold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted-foreground)' }}>VNĐ</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Nguồn nhận</Label>
            <div className="flex gap-2 flex-wrap">
              {[
                { v: 'bank', label: 'Ngân hàng', icon: <Building2 size={14} /> },
                { v: 'cash', label: 'Tiền mặt', icon: <Wallet size={14} /> },
                { v: 'momo', label: 'MoMo', icon: <Smartphone size={14} /> },
              ].map(o => (
                <button key={o.v} type="button" onClick={() => setSource(o.v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    border: source === o.v ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: source === o.v ? 'var(--primary-soft)' : 'transparent',
                    color: source === o.v ? 'var(--primary)' : 'var(--muted-foreground)',
                  }}>
                  {o.icon}{o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Ghi chú (tuỳ chọn)</Label>
            <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} maxLength={200} />
          </div>
        </div>
        <div className="px-5 pt-3 pb-8" style={{ borderTop: '1px solid var(--border)' }}>
          <Button disabled={submitting} onClick={submit}
            className="w-full h-12 rounded-xl text-sm font-semibold tracking-wide"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            {submitting ? 'Đang ghi…' : 'XÁC NHẬN ĐÃ NHẬN'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
