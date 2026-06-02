'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface SummaryCardSkeletonProps {
  /** If true, render extra rows mimicking the debt-list card layout */
  hasList?: boolean;
}

export function SummaryCardSkeleton({ hasList }: SummaryCardSkeletonProps = {}) {
  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-2xl"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-full skeleton-animate" />
        <Skeleton className="h-3 w-20 rounded skeleton-animate" />
      </div>
      <Skeleton className="h-7 w-28 rounded skeleton-animate" />
      <Skeleton className="h-3 w-24 rounded skeleton-animate" />
      {hasList && (
        <>
          <div className="h-px w-full" style={{ background: 'var(--border)' }} />
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full skeleton-animate" />
              <div className="flex-1 flex flex-col gap-1">
                <Skeleton className="h-3 w-20 rounded skeleton-animate" />
                <Skeleton className="h-2.5 w-12 rounded skeleton-animate" />
              </div>
              <Skeleton className="h-4 w-10 rounded skeleton-animate" />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
