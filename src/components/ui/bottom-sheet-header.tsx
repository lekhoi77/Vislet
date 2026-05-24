'use client';

import type { ReactNode } from 'react';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SheetCloseButton } from '@/components/ui/sheet-close-button';
import { cn } from '@/lib/utils';

interface BottomSheetHeaderProps {
  title: ReactNode;
  /** Props từ useDraggableSheet — bỏ qua nếu sheet không kéo */
  handleProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Thanh kéo tĩnh (không draggable) */
  showHandle?: boolean;
  className?: string;
  titleClassName?: string;
  withBorder?: boolean;
}

/**
 * Header chuẩn cho bottom sheet: tay cầm (tuỳ chọn) + tiêu đề + nút X cùng hàng.
 */
export function BottomSheetHeader({
  title,
  handleProps,
  showHandle = false,
  className,
  titleClassName,
  withBorder = true,
}: BottomSheetHeaderProps) {
  const showDragHandle = Boolean(handleProps) || showHandle;

  return (
    <div
      className={cn('shrink-0', className)}
      style={withBorder ? { borderBottom: '1px solid var(--border)' } : undefined}
    >
      {showDragHandle && (
        <div
          {...handleProps}
          className={cn(
            'flex justify-center pt-3 pb-1',
            handleProps && 'cursor-grab active:cursor-grabbing touch-none select-none',
          )}
          role={handleProps ? 'button' : undefined}
          aria-label={handleProps ? 'Kéo để mở rộng hoặc thu nhỏ' : undefined}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
      )}
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-0.5 min-h-[44px]">
        <SheetHeader className="p-0 flex-1 min-w-0">
          <SheetTitle
            className={cn(
              'text-base font-semibold text-left leading-tight pr-0',
              titleClassName,
            )}
            style={{ color: 'var(--foreground)' }}
          >
            {title}
          </SheetTitle>
        </SheetHeader>
        <SheetCloseButton />
      </div>
    </div>
  );
}
