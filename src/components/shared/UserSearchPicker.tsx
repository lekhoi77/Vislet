'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Link2, User as UserIcon, X, Check } from 'lucide-react';
import type { UserSearchResult, DebtContact } from '@/lib/types';

export interface PickedDebtor {
  type: 'linked' | 'unlinked';
  userId: string | null;
  profileId: string | null;
  name: string;
  email: string | null;
  avatarColor?: string;
  initial?: string;
}

interface Props {
  value: PickedDebtor | null;
  onChange: (v: PickedDebtor | null) => void;
}

export function UserSearchPicker({ value, onChange }: Props) {
  const { debtContacts, searchUsers, refreshContacts } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => { refreshContacts(); }, [refreshContacts]);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await searchUsers(q);
      setResults(r);
      setLoading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [query, searchUsers]);

  // Lọc recent contacts theo query
  const filteredContacts = useMemo<DebtContact[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return debtContacts.slice(0, 6);
    return debtContacts.filter(c =>
      c.contactName.toLowerCase().includes(q) ||
      (c.contactEmail ?? '').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [debtContacts, query]);

  // Lọc kết quả search: bỏ các user đã có trong recent contacts (tránh trùng)
  const filteredResults = useMemo(() => {
    const contactUserIds = new Set(debtContacts.map(c => c.contactUserId).filter(Boolean));
    return results.filter(r => !contactUserIds.has(r.userId));
  }, [results, debtContacts]);

  const pickLinked = (r: UserSearchResult) => {
    onChange({
      type: 'linked',
      userId: r.userId,
      profileId: r.profileId,
      name: r.name,
      email: r.email,
      avatarColor: r.avatarColor,
      initial: r.initial,
    });
    setOpen(false);
    setQuery('');
  };

  const pickContact = (c: DebtContact) => {
    onChange({
      type: c.contactType,
      userId: c.contactUserId,
      profileId: null,
      name: c.contactName,
      email: c.contactEmail,
    });
    setOpen(false);
    setQuery('');
  };

  const pickUnlinked = () => {
    const name = query.trim() || 'Người ngoài hệ thống';
    onChange({ type: 'unlinked', userId: null, profileId: null, name, email: null });
    setOpen(false);
    setQuery('');
  };

  // Đã chọn xong: hiển thị chip đã chọn
  if (value) {
    const isLinked = value.type === 'linked';
    return (
      <div
        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
        style={{ background: isLinked ? 'var(--primary-soft)' : 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar style={{ width: 32, height: 32 }}>
            <AvatarFallback
              style={{
                background: value.avatarColor ?? (isLinked ? 'var(--primary)' : 'var(--muted-foreground)'),
                color: '#fff', fontSize: 13, fontWeight: 700,
              }}
            >
              {value.initial ?? (value.name.charAt(0).toUpperCase() || '?')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{value.name}</p>
              {isLinked
                ? <span title="Có tài khoản"><Link2 size={11} style={{ color: 'var(--primary)' }} /></span>
                : <span title="Ngoài hệ thống"><UserIcon size={11} style={{ color: 'var(--muted-foreground)' }} /></span>
              }
            </div>
            {value.email && <p className="text-[12px] truncate" style={{ color: 'var(--muted-foreground)' }}>{value.email}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1.5 rounded-lg hover:bg-[var(--muted)] shrink-0"
          aria-label="Đổi người"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
        <Input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Email hoặc tên người dùng..."
          className="h-11 rounded-xl"
          style={{ paddingLeft: 36 }}
        />
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', maxHeight: 320, overflowY: 'auto' }}
        >
          {/* Recent contacts */}
          {filteredContacts.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                Người đã giao dịch
              </div>
              {filteredContacts.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickContact(c)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--muted)] text-left"
                >
                  <Avatar style={{ width: 28, height: 28 }}>
                    <AvatarFallback style={{
                      background: c.contactType === 'linked' ? 'var(--primary)' : 'var(--muted-foreground)',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                    }}>
                      {c.contactName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{c.contactName}</p>
                      {c.contactType === 'linked'
                        ? <Link2 size={10} style={{ color: 'var(--primary)' }} />
                        : <UserIcon size={10} style={{ color: 'var(--muted-foreground)' }} />
                      }
                    </div>
                    {c.contactEmail && <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>{c.contactEmail}</p>}
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Search results */}
          {query.trim().length > 0 && filteredResults.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)', borderTop: filteredContacts.length > 0 ? '1px solid var(--border)' : 'none' }}>
                Tìm trong hệ thống
              </div>
              {filteredResults.map(r => (
                <button
                  key={r.userId}
                  type="button"
                  onClick={() => pickLinked(r)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--muted)] text-left"
                >
                  <Avatar style={{ width: 28, height: 28 }}>
                    <AvatarFallback style={{ background: r.avatarColor, color: '#fff', fontSize: 12, fontWeight: 700 }}>
                      {r.initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{r.name}</p>
                    {r.email && <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>{r.email}</p>}
                  </div>
                  <Check size={13} style={{ color: 'var(--primary)' }} />
                </button>
              ))}
            </>
          )}

          {/* Empty state */}
          {query.trim().length > 0 && !loading && filteredResults.length === 0 && filteredContacts.length === 0 && (
            <p className="px-3 py-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Không tìm thấy ai. Bạn có thể thêm người ngoài hệ thống.
            </p>
          )}

          {loading && (
            <p className="px-3 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>Đang tìm…</p>
          )}

          {/* Add unlinked */}
          <button
            type="button"
            onClick={pickUnlinked}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--muted)]"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <UserPlus size={14} style={{ color: 'var(--primary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
              {query.trim() ? `Thêm "${query.trim()}" (ngoài hệ thống)` : 'Thêm người ngoài hệ thống'}
            </span>
          </button>
        </div>
      )}

      {open && <button type="button" onClick={() => setOpen(false)} className="fixed inset-0 z-40" aria-hidden />}
    </div>
  );
}
