'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function SummaryCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-2 p-5 rounded-2xl"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      <Skeleton className="h-3 w-16 rounded skeleton-animate" />
      <Skeleton className="h-7 w-28 rounded skeleton-animate" />
      <Skeleton className="h-3 w-20 rounded skeleton-animate" />
    </div>
  );
}
