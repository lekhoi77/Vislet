'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useDraggableSheet } from '@/lib/use-draggable-sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { AppIcon, SOURCE_ICON_NAMES } from '@/lib/icons';
import { Plus, Trash2, Pencil, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CustomSource } from '@/lib/types';

interface AddSourceSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddSourceSheet({ open, onClose }: AddSourceSheetProps) {
  const { customSources, addCustomSource, removeCustomSource, updateCustomSource, reorderCustomSources } = useAppStore();
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('Wallet');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('Wallet');

  const handleAdd = () => {
    if (!label.trim() || label.trim().length > 30) return;
    addCustomSource(label, icon);
    setLabel('');
    setIcon('Wallet');
    toast.success('Đã thêm nguồn tiền');
  };

  const startEdit = (s: CustomSource) => {
    setEditingId(s.id);
    setEditLabel(s.label);
    setEditIcon((s as { icon?: string }).icon ?? 'Wallet');
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (!editLabel.trim() || !editingId) return;
    try {
      await updateCustomSource(editingId, editLabel, editIcon);
      setEditingId(null);
      toast.success('Đã cập nhật');
    } catch {
      toast.error('Không thể cập nhật');
    }
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const ids = customSources.map(s => s.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    reorderCustomSources(ids);
  };

  const moveDown = (idx: number) => {
    if (idx === customSources.length - 1) return;
    const ids = customSources.map(s => s.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    reorderCustomSources(ids);
  };

  const { expanded, sheetStyle, handleProps } = useDraggableSheet('add-source-expanded', true);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl gap-0 flex flex-col"
        style={{ padding: 0, background: 'var(--background)', ...sheetStyle }}
      >
        <div className="shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            {...handleProps}
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
            role="button"
            aria-label={expanded ? 'Thu nhỏ' : 'Mở rộng'}
          >
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
          <div className="px-5 pb-3">
            <SheetHeader className="p-0">
              <SheetTitle className="text-base font-semibold text-left" style={{ color: 'var(--foreground)' }}>
                Quản lý nguồn tiền
              </SheetTitle>
            </SheetHeader>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Tên nguồn */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Tên nguồn tiền
            </Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="VD: Ví Zalopay, Thẻ tín dụng..."
              maxLength={30}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>

          {/* Icon picker */}
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

          {/* Nút thêm */}
          <Button
            onClick={handleAdd}
            disabled={!label.trim()}
            className="w-full h-11 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Plus size={15} /> Thêm nguồn tiền
          </Button>

          {/* Danh sách custom sources */}
          {customSources.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Nguồn đã thêm
              </Label>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {customSources.map((s, i) => (
                  <div key={s.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: 'var(--card)' }}>
                    {editingId === s.id ? (
                      /* ── Edit mode ── */
                      <div className="flex flex-col gap-3 px-4 py-3">
                        <Input
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          maxLength={30}
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                        />
                        <div className="grid grid-cols-5 gap-1.5">
                          {SOURCE_ICON_NAMES.map(name => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setEditIcon(name)}
                              className="flex items-center justify-center h-9 rounded-lg transition-all"
                              style={{
                                background: editIcon === name ? 'var(--primary-soft)' : 'var(--muted)',
                                outline: editIcon === name ? '2px solid var(--primary)' : 'none',
                              }}
                            >
                              <AppIcon name={name} size={15} style={{ color: editIcon === name ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={saveEdit} disabled={!editLabel.trim()} className="flex-1 h-9 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                            <Check size={13} /> Lưu
                          </Button>
                          <Button onClick={cancelEdit} className="flex-1 h-9 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
                            <X size={13} /> Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* ── Normal row ── */
                      <div className="flex items-center px-3 py-2.5 gap-1">
                        {/* Reorder buttons */}
                        <div className="flex flex-col mr-1">
                          <button
                            onClick={() => moveUp(i)}
                            disabled={i === 0}
                            className="p-0.5 rounded transition-colors disabled:opacity-20"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            onClick={() => moveDown(i)}
                            disabled={i === customSources.length - 1}
                            className="p-0.5 rounded transition-colors disabled:opacity-20"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>

                        <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0" style={{ background: 'var(--muted)' }}>
                          <AppIcon name={(s as { icon?: string }).icon ?? 'Wallet'} size={16} style={{ color: 'var(--primary)' }} />
                        </div>
                        <span className="text-sm font-medium flex-1 min-w-0 truncate ml-2" style={{ color: 'var(--foreground)' }}>{s.label}</span>

                        <button
                          onClick={() => startEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => { removeCustomSource(s.id); toast.success('Đã xoá'); }}
                          className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                          style={{ color: 'var(--destructive)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
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
