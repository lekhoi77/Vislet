'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddSourceSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddSourceSheet({ open, onClose }: AddSourceSheetProps) {
  const { customSources, addCustomSource, removeCustomSource } = useAppStore();
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    if (!label.trim()) return;
    if (label.trim().length > 30) return;
    addCustomSource(label);
    setLabel('');
    toast.success('Đã thêm nguồn tiền');
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80dvh] gap-0" style={{ padding: 0, background: 'var(--background)' }}>
        <div className="shrink-0 px-5 pt-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="mx-auto w-10 h-1 rounded-full bg-[var(--border)] mb-3" />
          <SheetHeader className="p-0">
            <SheetTitle className="text-base font-semibold text-left" style={{ color: 'var(--foreground)' }}>
              Quản lý nguồn tiền
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Add new */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Thêm nguồn mới
            </Label>
            <div className="flex gap-2">
              <Input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="VD: Ví Zalopay, Crypto..."
                maxLength={30}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <Button
                onClick={handleAdd}
                disabled={!label.trim()}
                className="shrink-0 h-10 px-3 rounded-xl"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Custom list */}
          {customSources.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Nguồn đã thêm
              </Label>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {customSources.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: 'var(--card)' }}
                  >
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.label}</span>
                    <button
                      onClick={() => { removeCustomSource(s.id); toast.success('Đã xoá'); }}
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
