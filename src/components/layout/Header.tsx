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
      <span
        className="text-xl font-bold tracking-tight"
        style={{ color: 'var(--primary)' }}
      >
        ví.app
      </span>
      <ProfileSwitcher onAddProfile={onAddProfile} />
    </header>
  );
}
