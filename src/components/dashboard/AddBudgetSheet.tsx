'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useDraggableSheet } from '@/lib/use-draggable-sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { CategoryIcon, CATEGORY_ICON_NAMES } from '@/lib/icons';
import { Plus, Trash2, Pencil, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CustomCategory } from '@/lib/types';
import { PROTECTED_GOAL_ID } from '@/lib/catalog-policy';

interface AddCategorySheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddCategorySheet({ open, onClose }: AddCategorySheetProps) {
  const { customCategories: rawCategories, addCustomCategory, removeCustomCategory, updateCustomCategory, reorderCustomCategories } = useAppStore();
  // Ẩn 'none' (Chưa phân loại) — chỉ là marker hệ thống, không phải danh mục thực sự
  const customCategories = rawCategories.filter(c => c.id !== PROTECTED_GOAL_ID);
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('ShoppingCart');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('ShoppingCart');

  const handleAdd = async () => {
    if (!label.trim()) return;
    try {
      await addCustomCategory(label, icon);
      setLabel('');
      setIcon('ShoppingCart');
      toast.success('Đã thêm danh mục');
    } catch (err) {
      toast.error(`Lỗi: ${(err as { message?: string })?.message ?? 'Không thể thêm'}`);
    }
  };

  const startEdit = (c: CustomCategory) => {
    setEditingId(c.id);
    setEditLabel(c.label);
    setEditIcon(c.icon);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (!editLabel.trim() || !editingId) return;
    try {
      await updateCustomCategory(editingId, editLabel, editIcon);
      setEditingId(null);
      toast.success('Đã cập nhật');
    } catch {
      toast.error('Không thể cập nhật');
    }
  };

  const applyReorder = (newOrderedIds: string[]) => {
    // Gắn lại các id ẩn (vd 'none') vào đầu để không bị mất khỏi store
    const hiddenIds = rawCategories.map(c => c.id).filter(id => !newOrderedIds.includes(id));
    reorderCustomCategories([...hiddenIds, ...newOrderedIds]);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const ids = customCategories.map(c => c.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    applyReorder(ids);
  };

  const moveDown = (idx: number) => {
    if (idx === customCategories.length - 1) return;
    const ids = customCategories.map(c => c.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    applyReorder(ids);
  };

  const { expanded, sheetStyle, handleProps } = useDraggableSheet('add-category-expanded', true);

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
                Quản lý danh mục
              </SheetTitle>
            </SheetHeader>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Tên danh mục
            </Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="VD: Ăn uống, Giải trí..."
              maxLength={30}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
          </div>

          {/* Icon picker */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Chọn icon
            </Label>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_ICON_NAMES.map(name => (
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
                  <CategoryIcon name={name} size={18} style={{ color: icon === name ? 'var(--primary)' : 'var(--muted-foreground)' }} />
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
            <Plus size={15} /> Thêm danh mục
          </Button>

          {/* Existing custom categories */}
          {customCategories.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Danh mục đã thêm
              </Label>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {customCategories.map((c, i) => (
                  <div key={c.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: 'var(--card)' }}>
                    {editingId === c.id ? (
                      /* ── Edit mode ── */
                      <div className="flex flex-col gap-3 px-4 py-3">
                        <Input
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          maxLength={30}
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                        />
                        <div className="grid grid-cols-6 gap-1.5">
                          {CATEGORY_ICON_NAMES.map(name => (
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
                              <CategoryIcon name={name} size={15} style={{ color: editIcon === name ? 'var(--primary)' : 'var(--muted-foreground)' }} />
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
                            disabled={i === customCategories.length - 1}
                            className="p-0.5 rounded transition-colors disabled:opacity-20"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>

                        <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0" style={{ background: 'var(--muted)' }}>
                          <CategoryIcon name={c.icon} size={16} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 ml-2">
                          <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{c.label}</span>
                        </div>

                        <button
                          onClick={() => startEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await removeCustomCategory(c.id);
                              toast.success('Đã xoá');
                            } catch (err) {
                              toast.error(`Không thể xoá: ${(err as Error).message ?? 'Lỗi không xác định'}`);
                            }
                          }}
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

// Backward-compat alias
export const AddBudgetSheet = AddCategorySheet;
