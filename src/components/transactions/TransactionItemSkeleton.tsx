'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TransactionItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0 skeleton-animate" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-36 rounded skeleton-animate" />
          <Skeleton className="h-4 w-20 rounded skeleton-animate" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-3 w-20 rounded skeleton-animate" />
          <Skeleton className="h-3 w-16 rounded skeleton-animate" />
        </div>
      </div>
    </div>
  );
}
