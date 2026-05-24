'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { ChevronDown, Check, Plus, LogOut } from 'lucide-react';
import { MAX_PROFILES } from '@/lib/constants';
import { toast } from 'sonner';

interface ProfileSwitcherProps {
  onAddAccount: () => void;
}

export function ProfileSwitcher({ onAddAccount }: ProfileSwitcherProps) {
  const { profiles, currentProfileId, switchProfile } = useAppStore();
  const { user, signOut } = useAuthStore();
  const current = profiles.find(p => p.id === currentProfileId);

  if (!current) return null;

  const handleSignOut = async () => {
    useAppStore.setState({
      profiles: [],
      currentProfileId: null,
      transactions: [],
      customSources: [],
      customCategories: [],
      isLoaded: false,
    });
    await signOut();
    toast.success('Đã đăng xuất');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-[var(--muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        aria-label="Chuyển profile"
      >
        <Avatar style={{ width: 28, height: 28 }}>
          <AvatarFallback
            style={{
              background: current.avatarColor,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {current.initial}
          </AvatarFallback>
        </Avatar>
        <span
          className="text-sm font-medium max-w-[80px] truncate"
          style={{ color: 'var(--foreground)' }}
        >
          {current.name}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--muted-foreground)' }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-60 rounded-xl"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        {user?.email && (
          <>
            <div className="flex flex-col gap-0.5 px-3 py-2">
              <span className="text-[14px] font-normal uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                Tài khoản
              </span>
              <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                {user.email}
              </span>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        {profiles.map(profile => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => switchProfile(profile.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Avatar style={{ width: 24, height: 24 }}>
              <AvatarFallback
                style={{
                  background: profile.avatarColor,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {profile.initial}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm">{profile.name}</span>
            {profile.id === currentProfileId && (
              <Check size={14} style={{ color: 'var(--primary)' }} />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onAddAccount}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Plus size={14} style={{ color: 'var(--muted-foreground)' }} />
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Thêm người dùng
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 cursor-pointer"
        >
          <LogOut size={14} style={{ color: 'var(--destructive)' }} />
          <span className="text-sm" style={{ color: 'var(--destructive)' }}>
            Đăng xuất
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
