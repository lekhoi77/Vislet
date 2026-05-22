'use client';

import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet-header';
import { useDraggableSheet } from '@/lib/use-draggable-sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { BudgetIcon, BUDGET_ICON_NAMES } from '@/lib/icons';
import { CatalogItemList } from '@/components/dashboard/CatalogItemList';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PROTECTED_GOAL_ID } from '@/lib/catalog-policy';

interface AddBudgetSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddBudgetSheet({ open, onClose }: AddBudgetSheetProps) {
  const { customBudgets, addCustomBudget, updateCustomBudget, removeCustomBudget } = useAppStore();
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('ShoppingCart');

  const handleAdd = async () => {
    if (!label.trim()) return;
    try {
      await addCustomBudget(label, icon);
      setLabel('');
      setIcon('ShoppingCart');
      toast.success('Đã thêm mục tiêu');
    } catch (err) {
      toast.error(`Lỗi: ${(err as { message?: string })?.message ?? 'Không thể thêm'}`);
    }
  };

  const { expanded, sheetStyle, handleProps } = useDraggableSheet('add-budget-expanded', true);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl gap-0 flex flex-col"
        style={{ padding: 0, background: 'var(--background)', ...sheetStyle }}
      >
        <BottomSheetHeader
          handleProps={{
            ...handleProps,
            'aria-label': expanded ? 'Thu nhỏ' : 'Mở rộng',
          }}
          title="Quản lý mục tiêu"
        />

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          <CatalogItemList
            items={customBudgets}
            listLabel="Danh sách mục tiêu"
            protectedIds={[PROTECTED_GOAL_ID]}
            renderIcon={name => <BudgetIcon name={name} size={16} style={{ color: 'var(--primary)' }} />}
            onUpdate={async (id, data) => {
              await updateCustomBudget(id, data);
              toast.success('Đã cập nhật');
            }}
            onRemove={async id => {
              try {
                const { reassigned } = await removeCustomBudget(id);
                if (reassigned > 0) {
                  toast.success(`Đã chuyển ${reassigned} giao dịch sang Chưa phân loại và xóa mục tiêu`);
                } else {
                  toast.success('Đã xoá mục tiêu');
                }
              } catch (err) {
                toast.error((err as Error).message ?? 'Không thể xóa');
              }
            }}
          />

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Thêm mục tiêu mới
            </Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="VD: Ăn uống, Giải trí..."
              maxLength={30}
              onKeyDown={e => e.key === 'Enter' && void handleAdd()}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Chọn icon
            </Label>
            <div className="grid grid-cols-6 gap-2">
              {BUDGET_ICON_NAMES.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  className={cn(
                    'flex items-center justify-center h-11 rounded-xl transition-all',
                    icon === name ? 'ring-2' : 'hover:bg-[var(--muted)]',
                  )}
                  style={{
                    background: icon === name ? 'var(--primary-soft)' : 'var(--muted)',
                    outline: icon === name ? '2px solid var(--primary)' : 'none',
                  }}
                  title={name}
                >
                  <BudgetIcon name={name} size={18} style={{ color: icon === name ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => void handleAdd()}
            disabled={!label.trim()}
            className="w-full h-11 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Plus size={15} /> Thêm mục tiêu
          </Button>
        </div>

        <div className="shrink-0 px-5 pt-3 pb-8" style={{ borderTop: '1px solid var(--border)' }}>
          <Button onClick={onClose} className="w-full h-11 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
            Xong
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
