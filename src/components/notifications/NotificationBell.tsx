'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { Bell, Check, X, CheckCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { formatVND } from '@/lib/format';
import type { SharedExpenseNotification, SharedExpenseNotificationType } from '@/lib/types';

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

const ICONS: Record<SharedExpenseNotificationType, string> = {
  split_request: '💸',
  split_accepted: '✅',
  split_rejected: '❌',
  payment_claimed: '💰',
  payment_confirmed: '✓',
  payment_denied: '⚠️',
  split_cancelled: '🚫',
  due_reminder: '⏰',
};

export function NotificationBell() {
  const { notifications, sharedExpenses, markNotifRead, markAllNotifsRead, acceptSharedExpense, rejectSharedExpense } = useAppStore();
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const handleAccept = async (n: SharedExpenseNotification) => {
    if (!n.sharedExpenseId) return;
    try {
      await acceptSharedExpense(n.sharedExpenseId);
      await markNotifRead(n.id);
      toast.success('Đã xác nhận khoản chi chung');
    } catch {
      toast.error('Không thể xác nhận');
    }
  };

  const handleReject = async (n: SharedExpenseNotification) => {
    if (!n.sharedExpenseId) return;
    try {
      await rejectSharedExpense(n.sharedExpenseId);
      await markNotifRead(n.id);
      toast.success('Đã từ chối khoản chi chung');
    } catch {
      toast.error('Không thể từ chối');
    }
  };

  const isRequestActive = (n: SharedExpenseNotification) => {
    if (n.type !== 'split_request' || !n.sharedExpenseId) return false;
    const expense = sharedExpenses.find(e => e.id === n.sharedExpenseId);
    return expense?.status === 'pending';
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center rounded-full transition-colors hover:bg-[var(--muted)]"
        style={{ width: 36, height: 36 }}
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
      >
        <Bell size={18} style={{ color: 'var(--foreground)' }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{
              minWidth: 16, height: 16, padding: '0 4px',
              background: 'var(--down)', color: '#fff',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl gap-0 flex flex-col p-0"
          style={{ background: 'var(--background)', maxHeight: '85dvh' }}>
          <div className="shrink-0 flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
          <SheetHeader className="shrink-0 px-5 pt-1 pb-3 gap-0 flex flex-row items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle className="text-base font-semibold text-left" style={{ color: 'var(--foreground)' }}>
              Thông báo
            </SheetTitle>
            <SheetDescription className="sr-only">Danh sách thông báo về các khoản chi chung</SheetDescription>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => { markAllNotifsRead(); toast.success('Đã đánh dấu tất cả'); }}
                className="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg hover:bg-[var(--muted)]"
                style={{ color: 'var(--primary)' }}
              >
                <CheckCheck size={13} /> Đánh dấu đã đọc
              </button>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ color: 'var(--muted-foreground)' }}>
                <Bell size={32} />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => { if (!n.isRead) markNotifRead(n.id); }}
                    className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[var(--muted)] transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: n.isRead ? 'transparent' : 'var(--primary-soft)',
                    }}
                  >
                    <div className="text-xl shrink-0" style={{ lineHeight: 1 }}>{ICONS[n.type] ?? '🔔'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug" style={{ color: 'var(--foreground)' }}>
                        {n.message}
                      </p>
                      {n.amount > 0 && (
                        <p className="text-sm font-semibold amount mt-0.5" style={{ color: 'var(--foreground)' }}>
                          {formatVND(n.amount)}
                        </p>
                      )}
                      <p className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>{timeAgo(n.createdAt)}</p>

                      {isRequestActive(n) && (
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAccept(n); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                            style={{ background: 'var(--primary)', color: '#fff' }}
                          >
                            <Check size={12} /> Xác nhận
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleReject(n); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                            style={{ background: 'var(--muted)', color: 'var(--destructive)' }}
                          >
                            <X size={12} /> Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--primary)' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
