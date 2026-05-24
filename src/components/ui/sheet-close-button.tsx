'use client';

import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Nút đóng X — đặt trong hàng tiêu đề của bottom sheet */
export function SheetCloseButton({ className }: { className?: string }) {
  return (
    <SheetPrimitive.Close
      data-slot="sheet-close"
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
        'hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        className,
      )}
      style={{ color: 'var(--foreground)' }}
      aria-label="Đóng"
    >
      <XIcon className="size-4" strokeWidth={2} />
    </SheetPrimitive.Close>
  );
}
