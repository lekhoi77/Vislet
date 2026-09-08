'use client';

import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { formatVND, formatDate } from '@/lib/format';
import { resolveSourceLabel, resolveCategoryLabel } from '@/lib/constants';
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
  SheetTitle,
} from '@/components/ui/sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet-header';
import { useAppStore } from '@/store/app-store';
import { ArrowDownLeft, ArrowUpRight, EyeOff, FileText, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Highlight } from '@/components/shared/Highlight';

interface TransactionItemProps {
  tx: Transaction;
  onEdit: (tx: Transaction) => void;
  /** Query để bôi cam phần khớp trong title/note */
  highlightQuery?: string;
}

export function TransactionItem({ tx, onEdit, highlightQuery = '' }: TransactionItemProps) {
  const { deleteTransaction, customSources, customCategories } = useAppStore();
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const isIncome = tx.type === 'income';
  const amountStr = (isIncome ? '+' : '-') + formatVND(tx.amount);
  const sourceLabel = resolveSourceLabel(tx.source, customSources);
  const categoryLabel = resolveCategoryLabel(tx.category, customCategories);
  const hasCategory = tx.category && tx.category !== 'none';
  const isExcludedFromReports = tx.excludedFromReports ?? false;

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
            background: isIncome ? 'var(--primary-soft)' : 'var(--orange-soft)',
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
            <Highlight
              text={tx.title}
              query={highlightQuery}
              className="font-semibold text-sm truncate"
              style={{ color: 'var(--foreground)', lineHeight: '1.35' }}
            />
            <p
              className="flex-shrink-0 font-semibold text-sm amount"
              style={{ color: isIncome ? 'var(--up)' : 'var(--down)' }}
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
              {sourceLabel}
            </Badge>
            {hasCategory && (
              <Badge
                variant="secondary"
                className="text-[11px] px-1.5 py-0 h-auto font-medium border-0"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                {categoryLabel}
              </Badge>
            )}
            {isExcludedFromReports && (
              <Badge
                variant="secondary"
                className="text-[11px] px-1.5 py-0 h-auto font-medium border-0"
                style={{ background: 'var(--orange-soft)', color: 'var(--orange)' }}
              >
                Không tính báo cáo
              </Badge>
            )}
          </div>
          {tx.note && (
            <div className="flex items-center gap-1 mt-1">
              <FileText size={11} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <Highlight
                text={tx.note}
                query={highlightQuery}
                className="text-sm truncate"
                style={{ color: 'var(--muted-foreground)' }}
              />
            </div>
          )}
        </div>
      </button>

      {/* Detail Sheet */}
      <Sheet open={showDetail} onOpenChange={setShowDetail}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl gap-0 flex flex-col p-0"
          style={{ background: 'var(--background)' }}
        >
          <BottomSheetHeader title="Chi tiết giao dịch" showHandle withBorder={false} />

          <div className="flex flex-col gap-5 px-5 pb-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nội dung</span>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{tx.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Số tiền</span>
                <span className="text-base font-bold amount" style={{ color: isIncome ? 'var(--up)' : 'var(--down)' }}>
                  {amountStr}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nguồn tiền</span>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{sourceLabel}</span>
              </div>
              {hasCategory && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Danh mục</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{categoryLabel}</span>
                </div>
              )}
              {isExcludedFromReports && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Báo cáo</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--orange)' }}>
                    <EyeOff size={14} />
                    Không tính vào báo cáo
                  </span>
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
                style={{ background: 'var(--destructive)', color: '#fff' }}
                onClick={() => setShowDelete(true)}
              >
                <Trash2 size={15} />
                Xoá
              </Button>
            </div>
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
              style={{ background: 'var(--destructive)', color: '#fff' }}
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
