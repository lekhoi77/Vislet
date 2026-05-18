'use client';

import { ProfileSwitcher } from '@/components/profile/ProfileSwitcher';

interface HeaderProps {
  onAddProfile: () => void;
}

export function Header({ onAddProfile }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between"
      style={{
        height: 56,
        padding: '0 20px',
        background: 'var(--background)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <img
        src="/logo-text.svg"
        alt="Vislet"
        height={28}
        style={{ height: 28, width: 'auto' }}
      />
      <ProfileSwitcher onAddProfile={onAddProfile} />
    </header>
  );
}
