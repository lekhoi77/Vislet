'use client';

import { ProfileSwitcher } from '@/components/profile/ProfileSwitcher';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Calculator } from 'lucide-react';

interface HeaderProps {
  onAddAccount: () => void;
  onOpenGuide?: () => void;
  guidePulse?: boolean;
  /** Opens the floating calculator panel */
  onOpenCalc?: () => void;
  /** Whether calculator panel is currently open (for active styling) */
  calcOpen?: boolean;
}

export function Header({ onAddAccount, onOpenGuide, guidePulse, onOpenCalc, calcOpen }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between"
      style={{
        height: 56,
        padding: '0 20px',
        background: 'var(--card)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <img
        src="/logo-text.svg"
        alt="Vislet"
        height={48}
        style={{ height: 48, width: 'auto' }}
      />

      <div className="flex items-center gap-2">
        {/* Calculator trigger */}
        {onOpenCalc && (
          <button
            type="button"
            data-tour="calc"
            onClick={onOpenCalc}
            className="relative flex items-center justify-center rounded-full transition-colors hover:bg-[var(--muted)]"
            style={{ width: 36, height: 36 }}
            aria-label="Mở máy tính (phím C)"
            title="Máy tính — phím C"
          >
            <Calculator
              size={18}
              style={{ color: calcOpen ? 'var(--primary)' : 'var(--foreground)' }}
            />
          </button>
        )}

        <NotificationBell />

        <div data-tour="profile">
          <ProfileSwitcher
            onAddAccount={onAddAccount}
            onOpenGuide={onOpenGuide}
            guidePulse={guidePulse}
          />
        </div>
      </div>
    </header>
  );
}
