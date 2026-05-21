'use client';

import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { formatVND, formatDate } from '@/lib/format';
import { SOURCE_LABELS, GOAL_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAppStore } from '@/store/app-store';
import { ArrowDownLeft, ArrowUpRight, FileText, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionItemProps {
  tx: Transaction;
  onEdit: (tx: Transaction) => void;
}

export function TransactionItem({ tx, onEdit }: TransactionItemProps) {
  const { deleteTransaction } = useAppStore();
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const isIncome = tx.type === 'income';
  const amountStr = (isIncome ? '+' : '-') + formatVND(tx.amount);

  const handleDelete = () => {
    deleteTransaction(tx.id);
    toast.success('Đã xoá giao dịch');
    setShowDetail(false);
    setShowDelete(false);
  };

  return (
    <>
      <button
        className="w-full text-left flex items-start gap-3 p-4 hover:bg-[var(--muted)] transition-colors rounded-xl"
        onClick={() => setShowDetail(true)}
        id={`tx-item-${tx.id}`}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{
            width: 40,
            height: 40,
            background: isIncome ? 'var(--primary-soft)' : 'hsl(0, 65%, 96%)',
          }}
        >
          {isIncome
            ? <ArrowDownLeft size={18} style={{ color: 'var(--primary)' }} />
            : <ArrowUpRight size={18} style={{ color: 'var(--expense)' }} />
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className="font-semibold text-sm truncate"
              style={{ color: 'var(--foreground)', lineHeight: '1.35' }}
            >
              {tx.title}
            </p>
            <p
              className="flex-shrink-0 font-semibold text-sm amount"
              style={{ color: isIncome ? 'var(--income)' : 'var(--expense)' }}
            >
              {amountStr}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {formatDate(tx.date)}
            </span>
            <Badge
              variant="secondary"
              className="text-[11px] px-1.5 py-0 h-auto font-medium border-0"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              {SOURCE_LABELS[tx.source]}
            </Badge>
            {tx.goal !== 'none' && (
              <Badge
                variant="secondary"
                className="text-[11px] px-1.5 py-0 h-auto font-medium border-0"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                {GOAL_LABELS[tx.goal]}
              </Badge>
            )}
          </div>
          {tx.note && (
            <div className="flex items-center gap-1 mt-1">
              <FileText size={11} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <p className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
                {tx.note}
              </p>
            </div>
          )}
        </div>
      </button>

      {/* Detail Sheet */}
      <Sheet open={showDetail} onOpenChange={setShowDetail}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl"
          style={{ padding: '24px 20px 48px', background: 'var(--background)' }}
        >
          <div className="mx-auto w-10 h-1 rounded-full bg-[var(--border)] mb-5" />
          <SheetHeader className="mb-4">
            <SheetTitle className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              Chi tiết giao dịch
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nội dung</span>
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{tx.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Số tiền</span>
              <span className="text-base font-bold amount" style={{ color: isIncome ? 'var(--income)' : 'var(--expense)' }}>
                {amountStr}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nguồn tiền</span>
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{SOURCE_LABELS[tx.source]}</span>
            </div>
            {tx.goal !== 'none' && (
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Mục tiêu</span>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{GOAL_LABELS[tx.goal]}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Ngày</span>
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{formatDate(tx.date)}</span>
            </div>
            {tx.note && (
              <div className="flex flex-col gap-1">
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Ghi chú</span>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{tx.note}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 gap-2"
              onClick={() => {
                setShowDetail(false);
                onEdit(tx);
              }}
            >
              <Pencil size={15} />
              Sửa
            </Button>
            <Button
              className="flex-1 h-11 gap-2"
              style={{ background: 'var(--expense)', color: '#fff' }}
              onClick={() => setShowDelete(true)}
            >
              <Trash2 size={15} />
              Xoá
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá giao dịch?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá giao dịch &quot;{tx.title}&quot;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{ background: 'var(--expense)', color: '#fff' }}
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
