'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

function mapError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email hoặc mật khẩu không đúng';
  if (msg.includes('Email not confirmed')) return 'Vui lòng xác nhận email trước khi đăng nhập';
  if (msg.includes('User already registered')) return 'Email này đã được đăng ký';
  if (msg.includes('Password should be')) return 'Mật khẩu phải có ít nhất 6 ký tự';
  return msg;
}

export function LoginScreen() {
  const { signIn, signUp } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setLoading(true);
    setError('');
    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password);
      if (error) { setError(mapError(error)); setLoading(false); }
    } else {
      const { error } = await signUp(email.trim(), password);
      setLoading(false);
      if (error) setError(mapError(error));
      else setSignupSuccess(true);
    }
  };

  if (signupSuccess) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-dvh px-8 text-center"
        style={{ background: 'var(--background-subtle)' }}
      >
        <div
          className="w-full max-w-xs flex flex-col items-center gap-4 p-6 rounded-2xl"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ background: 'var(--muted)' }}>
            📧
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-base">Kiểm tra email của bạn</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Đã gửi link xác nhận đến <strong>{email}</strong>. Xác nhận xong là đăng nhập được nhé.
            </p>
          </div>
          <Button
            onClick={() => { setSignupSuccess(false); setMode('login'); }}
            variant="outline"
            className="w-full h-10 rounded-xl text-sm"
          >
            Quay lại đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh px-8 text-center"
      style={{ background: 'var(--background-subtle)' }}
    >
      <div className="mb-8 flex flex-col items-center gap-2">
        <img src="/logo-text.svg" alt="Vislet" style={{ height: 48, width: 'auto' }} />
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Quản lý tài chính cá nhân đơn giản
        </p>
      </div>

      <div
        className="w-full max-w-xs flex flex-col gap-4 p-6 rounded-2xl"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}
      >
        <p className="text-base font-semibold text-left" style={{ color: 'var(--foreground)' }}>
          {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </p>

        <div className="flex flex-col gap-3 text-left">
          <div className="flex flex-col gap-1.5">
            <Label style={{ color: 'var(--muted-foreground)', fontSize: 12, fontWeight: 500 }}>
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="ten@email.com"
              autoFocus
              autoComplete="email"
              lang="en"
              autoCorrect="off"
              spellCheck={false}
              style={{ imeMode: 'disabled' } as React.CSSProperties}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label style={{ color: 'var(--muted-foreground)', fontSize: 12, fontWeight: 500 }}>
              Mật khẩu
            </Label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                lang="en"
                autoCorrect="off"
                spellCheck={false}
                style={{ imeMode: 'disabled' } as React.CSSProperties}
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted-foreground)' }}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--expense)' }}>{error}</p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-11 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập →' : 'Tạo tài khoản →'}
        </Button>

        <p className="text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
          {mode === 'login' ? (
            <>
              Chưa có tài khoản?{' '}
              <button
                onClick={() => { setMode('signup'); setError(''); }}
                className="font-medium underline-offset-2 hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Đăng ký
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className="font-medium underline-offset-2 hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Đăng nhập
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
