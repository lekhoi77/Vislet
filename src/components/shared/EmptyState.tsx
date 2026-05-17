'use client';

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 text-center"
      style={{ padding: '64px 24px' }}
    >
      <Icon
        size={48}
        style={{ color: 'var(--muted-foreground)', opacity: 0.3 }}
      />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
