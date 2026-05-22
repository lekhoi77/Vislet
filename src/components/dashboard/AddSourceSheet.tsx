'use client';

import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet-header';
import { useDraggableSheet } from '@/lib/use-draggable-sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { AppIcon, SOURCE_ICON_NAMES } from '@/lib/icons';
import { CatalogItemList } from '@/components/dashboard/CatalogItemList';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddSourceSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddSourceSheet({ open, onClose }: AddSourceSheetProps) {
  const { customSources, addCustomSource, updateCustomSource, removeCustomSource } = useAppStore();
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('Wallet');

  const handleAdd = () => {
    if (!label.trim() || label.trim().length > 30) return;
    addCustomSource(label, icon);
    setLabel('');
    setIcon('Wallet');
    toast.success('Đã thêm nguồn tiền');
  };

  const { expanded, sheetStyle, handleProps } = useDraggableSheet('add-source-expanded', true);

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
          title="Quản lý nguồn tiền"
        />

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          <CatalogItemList
            items={customSources}
            listLabel="Danh sách nguồn tiền"
            renderIcon={name => <AppIcon name={name} size={16} style={{ color: 'var(--primary)' }} />}
            onUpdate={async (id, data) => {
              await updateCustomSource(id, data);
              toast.success('Đã cập nhật');
            }}
            onRemove={async id => {
              try {
                const { reassigned } = await removeCustomSource(id);
                if (reassigned > 0) {
                  toast.success(`Đã chuyển ${reassigned} giao dịch sang nguồn khác và xóa nguồn tiền`);
                } else {
                  toast.success('Đã xoá nguồn tiền');
                }
              } catch (err) {
                toast.error((err as Error).message ?? 'Không thể xóa');
              }
            }}
          />

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Thêm nguồn mới
            </Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="VD: Ví Zalopay, Thẻ tín dụng..."
              maxLength={30}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Chọn icon
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {SOURCE_ICON_NAMES.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  className={cn('flex items-center justify-center h-11 rounded-xl transition-all')}
                  style={{
                    background: icon === name ? 'var(--primary-soft)' : 'var(--muted)',
                    outline: icon === name ? '2px solid var(--primary)' : 'none',
                  }}
                  title={name}
                >
                  <AppIcon name={name} size={18} style={{ color: icon === name ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={!label.trim()}
            className="w-full h-11 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Plus size={15} /> Thêm nguồn tiền
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
