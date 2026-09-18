'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet-header';
import { Button } from '@/components/ui/button';
import { TransactionForm } from './TransactionForm';
import { useAppStore } from '@/store/app-store';
import { Transaction, TransactionType } from '@/lib/types';
import { resolveSourceLabel } from '@/lib/constants';
import { formatVND, formatDate } from '@/lib/format';
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export type DraftTransaction = Omit<Transaction, 'id' | 'createdAt'>;

interface DraftItem {
  key: string;
  data: DraftTransaction;
  /** true = do người dùng bấm "+" tạo, chưa từng có dữ liệu thật — dùng để form con hiện "Thêm" thay vì "Sửa". */
  isNew: boolean;
}

interface ReceiptScanReviewSheetProps {
  open: boolean;
  items: DraftTransaction[];
  defaultType: TransactionType;
  onClose: () => void;
}

// Component được remount (qua `key` do TransactionForm cấp) mỗi lần có 1 lượt
// quét mới — nên seed state nháp bằng lazy initializer là đủ, không cần effect.
export function ReceiptScanReviewSheet({ open, items, defaultType, onClose }: ReceiptScanReviewSheetProps) {
  const { addTransactions, customSources, customCategories } = useAppStore();
  const [drafts, setDrafts] = useState<DraftItem[]>(() => items.map(data => ({ key: uuidv4(), data, isNew: false })));
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const editingDraft = drafts.find(d => d.key === editingKey) ?? null;

  const handleRemove = (key: string) => {
    const remaining = drafts.filter(d => d.key !== key);
    setDrafts(remaining);
    if (remaining.length === 0) onClose();
  };

  const handleAddNew = () => {
    const key = uuidv4();
    setDrafts(prev => [...prev, {
      key,
      isNew: true,
      data: {
        type: defaultType,
        title: '',
        amount: 0,
        source: customSources.find(s => s.id === 'bank')?.id ?? customSources[0]?.id ?? 'bank',
        category: customCategories.find(c => c.id !== 'none')?.id ?? 'saving',
        note: '',
        date: new Date().toISOString(),
      },
    }]);
    setEditingKey(key);
  };

  // Form con đã lưu THẬT vào DB rồi (giống flow thêm giao dịch bình thường) —
  // chỉ cần bỏ dòng này khỏi danh sách đang chờ, không hỏi xác nhận lại lần 2.
  const handleSaveDraft = () => {
    const remaining = drafts.filter(d => d.key !== editingKey);
    setDrafts(remaining);
    setEditingKey(null);
    if (remaining.length === 0) onClose();
  };

  const handleConfirm = async () => {
    if (drafts.length === 0) { onClose(); return; }
    setIsSaving(true);
    try {
      await addTransactions(drafts.map(d => d.data));
      toast.success(`Đã tạo ${drafts.length} giao dịch`);
      onClose();
    } catch (err) {
      toast.error(`Lỗi: ${(err as Error).message ?? 'Không thể lưu giao dịch'}`);
      setIsSaving(false);
    }
  };

  return (
    <>
      <Sheet open={open && !editingDraft} onOpenChange={v => !v && !isSaving && onClose()}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl gap-0 flex flex-col p-0"
          style={{ background: 'var(--background)', height: '85vh' }}
        >
          <BottomSheetHeader title="Trích xuất hoá đơn" showHandle />

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
            {drafts.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: 'var(--muted-foreground)' }}>
                Không còn giao dịch nào, bấm + để thêm
              </p>
            )}
            {drafts.map(d => {
              const isIncome = d.data.type === 'income';
              const sourceLabel = resolveSourceLabel(d.data.source, customSources);
              return (
                <div
                  key={d.key}
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <button
                    type="button"
                    disabled={isSaving}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:opacity-60"
                    onClick={() => setEditingKey(d.key)}
                  >
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-xl"
                      style={{ width: 40, height: 40, background: isIncome ? 'var(--primary-soft)' : 'var(--orange-soft)' }}
                    >
                      {isIncome
                        ? <ArrowDownLeft size={18} style={{ color: 'var(--primary)' }} />
                        : <ArrowUpRight size={18} style={{ color: 'var(--expense)' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold" style={{ color: isIncome ? 'var(--primary)' : 'var(--orange)' }}>
                          {isIncome ? 'Tiền vào' : 'Tiền ra'}
                        </span>
                        <span className="text-sm font-semibold amount" style={{ color: isIncome ? 'var(--up)' : 'var(--down)' }}>
                          {formatVND(d.data.amount)}
                        </span>
                      </div>
                      <p className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {d.data.title || d.data.note || 'Chưa có nội dung'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatDate(d.data.date)}</span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>· {sourceLabel}</span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setEditingKey(d.key)}
                    className="shrink-0 p-2 rounded-lg disabled:opacity-60"
                    style={{ color: 'var(--muted-foreground)' }}
                    aria-label="Sửa giao dịch"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleRemove(d.key)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full disabled:opacity-60"
                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                    aria-label="Xoá dòng"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="shrink-0 px-4 pt-3 pb-8 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleAddNew}
              className="shrink-0 h-12 w-12 rounded-xl flex items-center justify-center disabled:opacity-60"
              style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
              aria-label="Thêm giao dịch"
            >
              <Plus size={18} />
            </button>
            <Button
              onClick={handleConfirm}
              disabled={isSaving || drafts.length === 0}
              className="flex-1 h-12 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {isSaving ? 'ĐANG LƯU...' : `XÁC NHẬN (${drafts.length})`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {editingDraft && (
        <TransactionForm
          open={!!editingDraft}
          type={editingDraft.data.type}
          draftInitial={editingDraft.data}
          isNewEntry={editingDraft.isNew}
          onSaveDraft={handleSaveDraft}
          onClose={() => setEditingKey(null)}
        />
      )}
    </>
  );
}
