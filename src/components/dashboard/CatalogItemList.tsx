'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Check, X, Lock } from 'lucide-react';
import { isProtectedGoalId } from '@/lib/catalog-policy';
import { cn } from '@/lib/utils';

export interface CatalogItem {
  id: string;
  label: string;
  icon: string;
}

interface CatalogItemListProps {
  items: CatalogItem[];
  listLabel: string;
  renderIcon: (icon: string) => React.ReactNode;
  onUpdate: (id: string, data: { label: string; icon?: string }) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  /** Ẩn nút xóa (mục hệ thống) */
  protectedIds?: string[];
}

export function CatalogItemList({
  items,
  listLabel,
  renderIcon,
  onUpdate,
  onRemove,
  protectedIds = [],
}: CatalogItemListProps) {
  const protectedSet = new Set(protectedIds);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setEditLabel(item.label);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  const saveEdit = async (id: string) => {
    const trimmed = editLabel.trim();
    if (!trimmed) return;
    await onUpdate(id, { label: trimmed });
    cancelEdit();
  };

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
        {listLabel}
      </Label>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 px-4 py-3"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: 'var(--card)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0" style={{ background: 'var(--muted)' }}>
                {renderIcon(item.icon)}
              </div>
              {editingId === item.id ? (
                <Input
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  maxLength={30}
                  className="h-9 text-sm flex-1"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') void saveEdit(item.id);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                />
              ) : (
                <div className="min-w-0 flex flex-col">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                    {item.label}
                  </span>
                  {(protectedSet.has(item.id) || isProtectedGoalId(item.id)) && (
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Luôn hiển thị · không xóa được
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {editingId === item.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => void saveEdit(item.id)}
                    className={cn('p-1.5 rounded-lg transition-colors')}
                    style={{ color: 'var(--primary)' }}
                    aria-label="Lưu"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                    style={{ color: 'var(--muted-foreground)' }}
                    aria-label="Huỷ"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                    style={{ color: 'var(--muted-foreground)' }}
                    aria-label="Đổi tên"
                  >
                    <Pencil size={14} />
                  </button>
                  {protectedSet.has(item.id) || isProtectedGoalId(item.id) ? (
                    <span
                      className="p-1.5 rounded-lg flex items-center"
                      style={{ color: 'var(--muted-foreground)' }}
                      title="Mục hệ thống"
                    >
                      <Lock size={14} />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void onRemove(item.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                      style={{ color: 'var(--expense)' }}
                      aria-label="Xoá"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
