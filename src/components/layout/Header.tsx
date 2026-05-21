'use client';

import { ProfileSwitcher } from '@/components/profile/ProfileSwitcher';

interface HeaderProps {
  onAddAccount: () => void;
}

export function Header({ onAddAccount }: HeaderProps) {
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
      <ProfileSwitcher onAddAccount={onAddAccount} />
    </header>
  );
}
