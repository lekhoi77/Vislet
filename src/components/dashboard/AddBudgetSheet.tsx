'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { BudgetIcon, BUDGET_ICON_NAMES } from '@/lib/icons';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddBudgetSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddBudgetSheet({ open, onClose }: AddBudgetSheetProps) {
  const { customBudgets, addCustomBudget, removeCustomBudget } = useAppStore();
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('ShoppingCart');

  const handleAdd = () => {
    if (!label.trim()) return;
    addCustomBudget(label, icon);
    setLabel('');
    setIcon('ShoppingCart');
    toast.success('Đã thêm mục tiêu');
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92dvh] gap-0" style={{ padding: 0, background: 'var(--background)' }}>
        <div className="shrink-0 px-5 pt-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="mx-auto w-10 h-1 rounded-full bg-[var(--border)] mb-3" />
          <SheetHeader className="p-0">
            <SheetTitle className="text-base font-semibold text-left" style={{ color: 'var(--foreground)' }}>
              Quản lý mục tiêu
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Tên mục tiêu
            </Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="VD: Ăn uống, Giải trí..."
              maxLength={30}
            />
          </div>

          {/* Icon picker */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
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
                    icon === name ? 'ring-2' : 'hover:bg-[var(--muted)]'
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

          {/* Add button */}
          <Button
            onClick={handleAdd}
            disabled={!label.trim()}
            className="w-full h-11 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Plus size={15} /> Thêm mục tiêu
          </Button>

          {/* Existing custom budgets */}
          {customBudgets.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Mục tiêu đã thêm
              </Label>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {customBudgets.map((b, i) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: 'var(--card)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'var(--muted)' }}>
                        <BudgetIcon name={b.icon} size={16} style={{ color: 'var(--primary)' }} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{b.label}</span>
                    </div>
                    <button
                      onClick={() => { removeCustomBudget(b.id); toast.success('Đã xoá'); }}
                      className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                      style={{ color: 'var(--expense)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
