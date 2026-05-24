'use client';

import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet-header';
import { Input } from '@/components/ui/input';
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
        className="rounded-t-2xl gap-0 flex flex-col p-0"
        style={{ background: 'var(--background)' }}
      >
        <BottomSheetHeader title="Thêm người dùng" titleClassName="text-sm" showHandle withBorder={false} />

        <div className="flex gap-2 px-5 pb-9 pt-2">
          <div className="flex flex-col gap-1 flex-1">
            <Input
              id="add-profile-name"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Tên người dùng..."
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className={error ? 'border-[var(--destructive)]' : ''}
              autoFocus
            />
            {error && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{error}</p>}
          </div>
          <Button
            id="add-profile-submit"
            onClick={handleAdd}
            className="h-10 px-4 rounded-xl text-sm font-semibold shrink-0"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Thêm
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
