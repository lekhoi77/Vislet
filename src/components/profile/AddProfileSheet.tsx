'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

interface AddProfileSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddProfileSheet({ open, onClose }: AddProfileSheetProps) {
  const { createProfile } = useAppStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên');
      return;
    }
    createProfile(name.trim());
    toast.success(`Đã thêm người dùng "${name.trim()}"`);
    setName('');
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl"
        style={{ padding: '24px 20px 48px', background: 'var(--background)' }}
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-[var(--border)] mb-5" />
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-semibold text-left" style={{ color: 'var(--foreground)' }}>
            Thêm người dùng mới
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Tên *
            </Label>
            <Input
              id="add-profile-name"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Nhập tên người dùng..."
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className={error ? 'border-[var(--expense)]' : ''}
              autoFocus
            />
            {error && <p className="text-xs" style={{ color: 'var(--expense)' }}>{error}</p>}
          </div>
          <Button
            id="add-profile-submit"
            onClick={handleAdd}
            className="w-full h-12 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Thêm người dùng
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
