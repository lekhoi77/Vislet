'use client';

import { useState } from 'react';
import { Debt } from '@/lib/types';
import { formatVND, formatDate } from '@/lib/format';
import { useAppStore } from '@/store/app-store';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Pencil, Trash2, Calendar, FileText } from 'lucide-react';

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
}

export function DebtCard({ debt, onEdit }: DebtCardProps) {
  const { settleDebt, deleteDebt } = useAppStore();
  const [showSettle, setShowSettle] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const isOwe = debt.type === 'owe';

  const handleSettle = () => {
    settleDebt(debt.id);
    toast.success('Đã xử lý khoản nợ');
    setShowSettle(false);
  };

  const handleDelete = () => {
    deleteDebt(debt.id);
    toast.success('Đã xoá khoản nợ');
    setShowDelete(false);
  };

  return (
    <>
      <div
        className="flex flex-col gap-3 p-4 rounded-2xl"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm"
              style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
            >
              {debt.person.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              {debt.person}
            </span>
          </div>
          <Badge
            className="text-[11px] px-2 py-0.5 h-auto font-medium border-0"
            style={{
              background: isOwe ? 'hsl(0, 65%, 96%)' : 'var(--primary-soft)',
              color: isOwe ? 'var(--expense)' : 'var(--income)',
            }}
          >
            {isOwe ? 'Tôi nợ' : 'Họ nợ tôi'}
          </Badge>
        </div>

        {/* Amount */}
        <p
          className="text-2xl font-bold amount"
          style={{ color: isOwe ? 'var(--expense)' : 'var(--income)' }}
        >
          {formatVND(debt.amount)}
        </p>

        {/* Note */}
        {debt.note && (
          <div className="flex items-center gap-1.5">
            <FileText size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{debt.note}</p>
          </div>
        )}

        {/* Due date */}
        <div className="flex items-center gap-1.5">
          <Calendar size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {debt.dueDate ? `Hạn: ${formatDate(debt.dueDate)}` : 'Chưa có hạn'}
          </p>
        </div>

        {/* Settled at */}
        {debt.settled && debt.settledAt && (
          <p className="text-xs" style={{ color: 'var(--income)' }}>
            ✓ Đã xử lý lúc {formatDate(debt.settledAt)}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {!debt.settled && (
            <Button
              size="sm"
              className="flex-1 h-9 gap-1.5 text-xs rounded-lg"
              style={{ background: 'var(--primary)', color: '#fff' }}
              onClick={() => setShowSettle(true)}
            >
              <Check size={13} />
              Đã trả ✓
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => onEdit(debt)}
            aria-label="Sửa"
          >
            <Pencil size={13} />
          </Button>
          <Button
            size="sm"
            className="h-9 w-9 p-0 rounded-lg"
            style={{ background: 'hsl(0,65%,96%)', color: 'var(--expense)', border: 'none' }}
            onClick={() => setShowDelete(true)}
            aria-label="Xoá"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Settle confirm */}
      <AlertDialog open={showSettle} onOpenChange={setShowSettle}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đã xử lý?</AlertDialogTitle>
            <AlertDialogDescription>
              Xác nhận đã xử lý khoản nợ {formatVND(debt.amount)} với {debt.person}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleSettle} style={{ background: 'var(--primary)', color: '#fff' }}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá khoản nợ?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá khoản nợ với {debt.person}? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} style={{ background: 'var(--expense)', color: '#fff' }}>
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
