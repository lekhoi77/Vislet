'use client';

import { ProfileSwitcher } from '@/components/profile/ProfileSwitcher';
import { BookOpen } from 'lucide-react';

interface HeaderProps {
  onAddAccount: () => void;
  onOpenGuide?: () => void;
  guidePulse?: boolean;
}

export function Header({ onAddAccount, onOpenGuide, guidePulse }: HeaderProps) {
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
        {onOpenGuide && (
          <div className="relative">
            <button
              type="button"
              data-tour="guide"
              onClick={onOpenGuide}
              className={`guide-btn ${guidePulse ? 'guide-btn-pulse' : ''}`}
              aria-label="Mở sổ tay hướng dẫn"
              title="Sổ tay hướng dẫn"
            >
              <BookOpen size={18} />
            </button>
          </div>
        )}
        <div data-tour="profile">
          <ProfileSwitcher onAddAccount={onAddAccount} />
        </div>
      </div>
    </header>
  );
}
