'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OnboardingScreenProps {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const { createProfile } = useAppStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleStart = () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }
    createProfile(name.trim());
    onDone();
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh px-8 text-center"
      style={{ background: 'var(--background-subtle)' }}
    >
      <div className="mb-8">
        <p
          className="text-4xl font-bold mb-2"
          style={{ color: 'var(--primary)', letterSpacing: '-0.02em' }}
        >
          ví.app
        </p>
        <p className="text-xl font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
          Chào mừng!
        </p>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Quản lý tài chính cá nhân đơn giản
        </p>
      </div>

      <div
        className="w-full max-w-xs flex flex-col gap-4 p-6 rounded-2xl"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}
      >
        <div className="flex flex-col gap-2 text-left">
          <Label style={{ color: 'var(--muted-foreground)', fontSize: 12, fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            Tên của bạn là gì?
          </Label>
          <Input
            id="onboarding-name"
            value={name}
            onChange={e => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Nhập tên..."
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            className={error ? 'border-[var(--expense)]' : ''}
            autoFocus
          />
          {error && <p className="text-sm" style={{ color: 'var(--expense)' }}>{error}</p>}
        </div>

        <Button
          id="onboarding-start"
          onClick={handleStart}
          className="w-full h-12 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          Bắt đầu →
        </Button>
      </div>
    </div>
  );
}
