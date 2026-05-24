import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  UserProfile, Transaction, CustomSource, CustomCategory,
  SharedDebt, DebtNotification, DebtContact, UserSearchResult,
} from '@/lib/types';
import { AVATAR_COLORS } from '@/lib/constants';
import {
  supabase,
  toProfile,
  toTransaction,
  toCustomSource,
  toCustomCategory,
  toSharedDebt,
  toSharedDebtPayment,
  toDebtNotification,
  toDebtContact,
} from '@/lib/supabase';

const CURRENT_KEY_PREFIX = 'viapp_current_';
const CURRENT_KEY_LEGACY = 'viapp_current';

function getStoredProfileId(userId: string): string | null {
  try {
    return localStorage.getItem(CURRENT_KEY_PREFIX + userId)
        ?? localStorage.getItem(CURRENT_KEY_LEGACY);
  } catch { return null; }
}
function setStoredProfileId(userId: string, profileId: string): void {
  try { localStorage.setItem(CURRENT_KEY_PREFIX + userId, profileId); } catch { /* noop */ }
}

interface NewSharedDebtInput {
  // Tx of A (current user) — đã có sẵn nếu tạo từ TransactionForm split.
  // Nếu null → đây là "ghi nợ" thuần (không gắn expense, A không thực sự bỏ tiền ra).
  sourceTransactionId?: string | null;
  totalExpense: number;
  debtAmount: number;

  debtorType: 'linked' | 'unlinked';
  debtorUserId?: string | null;
  debtorProfileId?: string | null;
  debtorName: string;
  debtorEmail?: string | null;

  direction: 'forward' | 'reverse'; // forward = họ nợ tôi; reverse = tôi nợ họ
  note: string;
  category: string;
  dueDate?: string | null;
}

interface AppState {
  profiles: UserProfile[];
  currentProfileId: string | null;
  transactions: Transaction[];
  sharedDebts: SharedDebt[];
  notifications: DebtNotification[];
  debtContacts: DebtContact[];
  customSources: CustomSource[];
  customCategories: CustomCategory[];
  isLoaded: boolean;
  isLoading: boolean;

  // Actions
  initApp: () => Promise<void>;
  createProfile: (name: string) => Promise<void>;
  switchProfile: (id: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;

  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addCustomSource: (label: string, icon?: string) => Promise<void>;
  removeCustomSource: (id: string) => Promise<void>;
  addCustomCategory: (label: string, icon: string) => Promise<void>;
  removeCustomCategory: (id: string) => Promise<void>;

  // Shared debts
  createSharedDebt: (input: NewSharedDebtInput) => Promise<SharedDebt>;
  acceptSharedDebt: (id: string) => Promise<void>;
  rejectSharedDebt: (id: string, reason?: string) => Promise<void>;
  cancelSharedDebt: (id: string) => Promise<void>;
  deleteSharedDebt: (id: string) => Promise<void>;
  claimPayment: (id: string, amount: number, paymentSource: string, note: string) => Promise<void>;
  confirmPayment: (paymentId: string) => Promise<void>;
  denyPayment: (paymentId: string) => Promise<void>;
  manualSettle: (id: string, amount: number, source: string, note: string) => Promise<void>;
  refreshSharedDebts: () => Promise<void>;

  // Notifications
  fetchNotifications: () => Promise<void>;
  markNotifRead: (id: string) => Promise<void>;
  markAllNotifsRead: () => Promise<void>;

  // User search & contacts
  searchUsers: (query: string) => Promise<UserSearchResult[]>;
  refreshContacts: () => Promise<void>;
  recordContact: (input: { contactUserId?: string | null; contactName: string; contactEmail?: string | null; contactType: 'linked' | 'unlinked' }) => Promise<void>;
}

// ─── Helper: fetch tất cả data của profile + user-level (debts) ───

async function fetchProfileData(profileId: string) {
  const [txRes, srcRes, catRes] = await Promise.all([
    supabase.from('transactions').select('*').eq('profile_id', profileId).order('date', { ascending: false }),
    supabase.from('sources').select('*').eq('profile_id', profileId).eq('is_builtin', false).order('created_at', { ascending: true }),
    supabase.from('categories').select('*').eq('profile_id', profileId).eq('is_builtin', false).order('created_at', { ascending: true }),
  ]);
  return {
    transactions: (txRes.data ?? []).map(toTransaction),
    customSources: (srcRes.data ?? []).map(toCustomSource),
    customCategories: (catRes.data ?? []).map(toCustomCategory),
  };
}

async function fetchUserScopedData(userId: string) {
  const [debtsRes, paymentsRes, notifRes, contactsRes] = await Promise.all([
    supabase.from('shared_debts').select('*').or(`creditor_user_id.eq.${userId},debtor_user_id.eq.${userId}`).order('created_at', { ascending: false }),
    supabase.from('shared_debt_payments').select('*').order('paid_at', { ascending: false }),
    supabase.from('debt_notifications').select('*').eq('recipient_user_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('debt_contacts').select('*').eq('owner_user_id', userId).order('last_used_at', { ascending: false }).limit(20),
  ]);
  const paymentsByDebt = new Map<string, ReturnType<typeof toSharedDebtPayment>[]>();
  (paymentsRes.data ?? []).forEach(p => {
    const arr = paymentsByDebt.get(p.shared_debt_id) ?? [];
    arr.push(toSharedDebtPayment(p));
    paymentsByDebt.set(p.shared_debt_id, arr);
  });
  return {
    sharedDebts: (debtsRes.data ?? []).map(d => toSharedDebt(d, (paymentsRes.data ?? []).filter(p => p.shared_debt_id === d.id))),
    notifications: (notifRes.data ?? []).map(toDebtNotification),
    debtContacts: (contactsRes.data ?? []).map(toDebtContact),
  };
}

// ─── Helper: tạo notification cho user khác ────────────────
async function pushNotification(input: {
  recipientUserId: string;
  type: string;
  sharedDebtId: string;
  actorName: string;
  amount: number;
  message: string;
}) {
  const { error } = await supabase.from('debt_notifications').insert({
    id: uuidv4(),
    recipient_user_id: input.recipientUserId,
    type: input.type,
    shared_debt_id: input.sharedDebtId,
    actor_name: input.actorName,
    amount: input.amount,
    message: input.message,
    is_read: false,
  });
  if (error) console.error('pushNotification:', error);
}

// ─── Store ──────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  currentProfileId: null,
  transactions: [],
  sharedDebts: [],
  notifications: [],
  debtContacts: [],
  customSources: [],
  customCategories: [],
  isLoaded: false,
  isLoading: false,

  initApp: async () => {
    set({ isLoading: true });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ profiles: [], currentProfileId: null, isLoaded: true, isLoading: false });
      return;
    }

    const { data: rows, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error || !rows || rows.length === 0) {
      set({ profiles: [], currentProfileId: null, isLoaded: true, isLoading: false });
      return;
    }

    const profiles = rows.map(toProfile);
    const storedId = getStoredProfileId(user.id);
    const activeId = (storedId && profiles.find(p => p.id === storedId)) ? storedId : profiles[0].id;

    const [profileData, userData] = await Promise.all([
      fetchProfileData(activeId),
      fetchUserScopedData(user.id),
    ]);
    set({ profiles, currentProfileId: activeId, ...profileData, ...userData, isLoaded: true, isLoading: false });
  },

  createProfile: async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { profiles } = get();
    const colorIndex = profiles.length % AVATAR_COLORS.length;
    const id = uuidv4();

    const { error } = await supabase.from('profiles').insert({
      id, user_id: user.id, name: name.trim(),
      avatar_color: AVATAR_COLORS[colorIndex],
      initial: name.trim().charAt(0).toUpperCase(),
      email: user.email,
    });

    if (error) { console.error('createProfile:', error); return; }

    const newProfile: UserProfile = {
      id, name: name.trim(),
      avatarColor: AVATAR_COLORS[colorIndex],
      initial: name.trim().charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(),
      email: user.email ?? null,
    };

    setStoredProfileId(user.id, id);
    set({
      profiles: [...profiles, newProfile],
      currentProfileId: id,
      transactions: [],
      customSources: [],
      customCategories: [],
    });
  },

  switchProfile: async (id: string) => {
    const { profiles } = get();
    if (!profiles.find(p => p.id === id)) return;
    set({ isLoading: true });
    const { data: { user } } = await supabase.auth.getUser();
    const profileData = await fetchProfileData(id);
    if (user) setStoredProfileId(user.id, id);
    set({ currentProfileId: id, ...profileData, isLoading: false });
  },

  deleteProfile: async (id: string) => {
    const { profiles, currentProfileId } = get();
    if (profiles.length <= 1) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { console.error('deleteProfile:', error); return; }
    const newProfiles = profiles.filter(p => p.id !== id);
    if (currentProfileId === id) {
      const nextId = newProfiles[0].id;
      const profileData = await fetchProfileData(nextId);
      if (user) setStoredProfileId(user.id, nextId);
      set({ profiles: newProfiles, currentProfileId: nextId, ...profileData });
    } else {
      set({ profiles: newProfiles });
    }
  },

  // ── Transactions ────────────────────────────────────────
  addTransaction: async (txData) => {
    const { currentProfileId, transactions } = get();
    if (!currentProfileId) throw new Error('Chưa có profile');

    const id = uuidv4();
    const { error } = await supabase.from('transactions').insert({
      id, profile_id: currentProfileId,
      type: txData.type, title: txData.title, amount: txData.amount,
      source: txData.source, category: txData.category, note: txData.note ?? '',
      date: txData.date,
      is_auto_generated: txData.isAutoGenerated ?? false,
      linked_debt_id: txData.linkedDebtId ?? null,
      auto_kind: txData.autoKind ?? null,
    });
    if (error) throw new Error(error.message || 'Lỗi không xác định');

    const newTx: Transaction = { ...txData, id, createdAt: new Date().toISOString() };
    set({ transactions: [newTx, ...transactions] });
    return newTx;
  },

  updateTransaction: async (id, data) => {
    const { transactions } = get();
    const dbData: Record<string, unknown> = {};
    if (data.type     !== undefined) dbData.type     = data.type;
    if (data.title    !== undefined) dbData.title    = data.title;
    if (data.amount   !== undefined) dbData.amount   = data.amount;
    if (data.source   !== undefined) dbData.source   = data.source;
    if (data.category !== undefined) dbData.category = data.category;
    if (data.note     !== undefined) dbData.note     = data.note;
    if (data.date     !== undefined) dbData.date     = data.date;
    const { error } = await supabase.from('transactions').update(dbData).eq('id', id);
    if (error) { console.error('updateTransaction:', error); return; }
    set({ transactions: transactions.map(t => t.id === id ? { ...t, ...data } : t) });
  },

  deleteTransaction: async (id) => {
    const { transactions } = get();
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { console.error('deleteTransaction:', error); return; }
    set({ transactions: transactions.filter(t => t.id !== id) });
  },

  // ── Custom Sources ──────────────────────────────────────
  addCustomSource: async (label, icon = 'Wallet') => {
    const { currentProfileId, customSources } = get();
    if (!currentProfileId) return;
    const id = uuidv4();
    const { error } = await supabase.from('sources').insert({
      id, profile_id: currentProfileId, label: label.trim(), icon, is_builtin: false,
    });
    if (error) { console.error('addCustomSource:', error); return; }
    set({ customSources: [...customSources, { id, label: label.trim(), icon, createdAt: new Date().toISOString() }] });
  },
  removeCustomSource: async (id) => {
    const { customSources } = get();
    const { error } = await supabase.from('sources').delete().eq('id', id);
    if (error) { console.error('removeCustomSource:', error); return; }
    set({ customSources: customSources.filter(s => s.id !== id) });
  },

  addCustomCategory: async (label, icon) => {
    const { currentProfileId, customCategories } = get();
    if (!currentProfileId) throw new Error('Chưa có profile');
    const id = uuidv4();
    const { error } = await supabase.from('categories').insert({
      id, profile_id: currentProfileId, label: label.trim(), icon, is_builtin: false,
      sort_order: customCategories.length,
    });
    if (error) throw error;
    set({ customCategories: [...customCategories, { id, label: label.trim(), icon, createdAt: new Date().toISOString() }] });
  },
  removeCustomCategory: async (id) => {
    const { customCategories } = get();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { console.error('removeCustomCategory:', error); return; }
    set({ customCategories: customCategories.filter(c => c.id !== id) });
  },

  // ── Shared Debts ────────────────────────────────────────
  createSharedDebt: async (input) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { currentProfileId, profiles, sharedDebts } = get();
    if (!user || !currentProfileId) throw new Error('Chưa đăng nhập');

    const me = profiles.find(p => p.id === currentProfileId);
    const id = uuidv4();
    const status = input.debtorType === 'linked' ? 'pending' : 'active';

    const row = {
      id,
      creditor_user_id: user.id,
      creditor_profile_id: currentProfileId,
      creditor_name: me?.name ?? 'Bạn',
      debtor_type: input.debtorType,
      debtor_user_id: input.debtorUserId ?? null,
      debtor_profile_id: input.debtorProfileId ?? null,
      debtor_name: input.debtorName.trim(),
      debtor_email: input.debtorEmail ?? null,
      direction: input.direction,
      total_expense: input.totalExpense,
      debt_amount: input.debtAmount,
      remaining_amount: input.debtAmount,
      source_transaction_id: input.sourceTransactionId ?? null,
      status,
      note: input.note,
      category: input.category,
      due_date: input.dueDate ?? null,
      reject_reason: null,
      created_at: new Date().toISOString(),
      accepted_at: null,
      settled_at: null,
      manually_settled: false,
    };

    const { error } = await supabase.from('shared_debts').insert(row);
    if (error) throw new Error(error.message || 'Không thể tạo khoản nợ');

    // Notification cho B (linked)
    if (input.debtorType === 'linked' && input.debtorUserId) {
      const amt = input.debtAmount.toLocaleString('vi-VN');
      await pushNotification({
        recipientUserId: input.debtorUserId,
        type: 'debt_request',
        sharedDebtId: id,
        actorName: me?.name ?? 'Người dùng',
        amount: input.debtAmount,
        message: `${me?.name ?? 'Một người dùng'} muốn ghi nhận bạn nợ ${amt} ₫${input.note ? ` cho: ${input.note}` : ''}`,
      });
    }

    // Lưu contact
    await get().recordContact({
      contactUserId: input.debtorUserId ?? null,
      contactName: input.debtorName,
      contactEmail: input.debtorEmail ?? null,
      contactType: input.debtorType,
    });

    const debt = toSharedDebt(row);
    set({ sharedDebts: [debt, ...sharedDebts] });
    return debt;
  },

  acceptSharedDebt: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { sharedDebts, profiles, currentProfileId } = get();
    if (!user) return;
    const debt = sharedDebts.find(d => d.id === id);
    if (!debt) return;
    const me = profiles.find(p => p.id === currentProfileId);

    const acceptedAt = new Date().toISOString();
    const { error } = await supabase.from('shared_debts').update({
      status: 'active',
      accepted_at: acceptedAt,
      debtor_profile_id: currentProfileId, // B chọn profile để gắn nợ
      debtor_name: me?.name ?? debt.debtorName,
    }).eq('id', id);
    if (error) { console.error('acceptSharedDebt:', error); throw error; }

    await pushNotification({
      recipientUserId: debt.creditorUserId,
      type: 'debt_accepted',
      sharedDebtId: id,
      actorName: me?.name ?? 'Người dùng',
      amount: debt.debtAmount,
      message: `${me?.name ?? 'Người nợ'} đã xác nhận khoản nợ ${debt.debtAmount.toLocaleString('vi-VN')} ₫`,
    });

    set({
      sharedDebts: sharedDebts.map(d => d.id === id ? { ...d, status: 'active', acceptedAt, debtorProfileId: currentProfileId, debtorName: me?.name ?? d.debtorName } : d),
    });
  },

  rejectSharedDebt: async (id, reason) => {
    const { sharedDebts, profiles, currentProfileId } = get();
    const debt = sharedDebts.find(d => d.id === id);
    if (!debt) return;
    const me = profiles.find(p => p.id === currentProfileId);

    const { error } = await supabase.from('shared_debts').update({
      status: 'rejected',
      reject_reason: reason?.trim() || null,
    }).eq('id', id);
    if (error) { console.error('rejectSharedDebt:', error); throw error; }

    await pushNotification({
      recipientUserId: debt.creditorUserId,
      type: 'debt_rejected',
      sharedDebtId: id,
      actorName: me?.name ?? 'Người dùng',
      amount: debt.debtAmount,
      message: `${me?.name ?? 'Người nợ'} đã từ chối khoản nợ${reason ? ` (lý do: ${reason})` : ''}`,
    });

    set({ sharedDebts: sharedDebts.map(d => d.id === id ? { ...d, status: 'rejected', rejectReason: reason ?? null } : d) });
  },

  cancelSharedDebt: async (id) => {
    const { sharedDebts } = get();
    const debt = sharedDebts.find(d => d.id === id);
    if (!debt || debt.status !== 'pending') return;
    const { error } = await supabase.from('shared_debts').update({ status: 'cancelled' }).eq('id', id);
    if (error) { console.error('cancelSharedDebt:', error); return; }
    if (debt.debtorUserId) {
      await pushNotification({
        recipientUserId: debt.debtorUserId,
        type: 'debt_cancelled',
        sharedDebtId: id,
        actorName: debt.creditorName,
        amount: debt.debtAmount,
        message: `${debt.creditorName} đã huỷ yêu cầu nợ ${debt.debtAmount.toLocaleString('vi-VN')} ₫`,
      });
    }
    set({ sharedDebts: sharedDebts.map(d => d.id === id ? { ...d, status: 'cancelled' } : d) });
  },

  deleteSharedDebt: async (id) => {
    const { sharedDebts } = get();
    const { error } = await supabase.from('shared_debts').delete().eq('id', id);
    if (error) { console.error('deleteSharedDebt:', error); return; }
    set({ sharedDebts: sharedDebts.filter(d => d.id !== id) });
  },

  claimPayment: async (id, amount, paymentSource, note) => {
    const { sharedDebts, profiles, currentProfileId } = get();
    const debt = sharedDebts.find(d => d.id === id);
    if (!debt) return;
    const me = profiles.find(p => p.id === currentProfileId);

    const paymentId = uuidv4();
    const paidAt = new Date().toISOString();

    const { error: pErr } = await supabase.from('shared_debt_payments').insert({
      id: paymentId, shared_debt_id: id, amount, payment_source: paymentSource,
      paid_at: paidAt, note,
    });
    if (pErr) throw pErr;

    const { error: sErr } = await supabase.from('shared_debts').update({ status: 'pending_confirm' }).eq('id', id);
    if (sErr) throw sErr;

    await pushNotification({
      recipientUserId: debt.creditorUserId,
      type: 'payment_claimed',
      sharedDebtId: id,
      actorName: me?.name ?? 'Người nợ',
      amount,
      message: `${me?.name ?? 'Người nợ'} nói đã trả ${amount.toLocaleString('vi-VN')} ₫${note ? ` — "${note}"` : ''}`,
    });

    const newPayment = {
      id: paymentId, sharedDebtId: id, amount, paymentSource,
      paidAt, confirmedAt: null, note, incomeTransactionId: null, expenseTransactionId: null,
    };
    set({
      sharedDebts: sharedDebts.map(d => d.id === id
        ? { ...d, status: 'pending_confirm', payments: [...(d.payments ?? []), newPayment] }
        : d),
    });
  },

  confirmPayment: async (paymentId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { sharedDebts, profiles, currentProfileId } = get();
    if (!user || !currentProfileId) return;

    // Tìm payment + debt
    let debtForPayment: SharedDebt | undefined;
    let payment;
    for (const d of sharedDebts) {
      const p = d.payments?.find(x => x.id === paymentId);
      if (p) { debtForPayment = d; payment = p; break; }
    }
    if (!debtForPayment || !payment) return;
    const me = profiles.find(p => p.id === currentProfileId);
    const now = new Date().toISOString();

    // 1. Tạo income tự động bên A (current user = creditor)
    const incomeTxId = uuidv4();
    const incomeTitle = `Thu nợ: ${debtForPayment.debtorName}${debtForPayment.note ? ` — ${debtForPayment.note}` : ''}`;
    const { error: incErr } = await supabase.from('transactions').insert({
      id: incomeTxId,
      profile_id: currentProfileId,
      type: 'income',
      title: incomeTitle,
      amount: payment.amount,
      source: payment.paymentSource ?? 'bank',
      category: 'none',
      note: payment.note ?? '',
      date: now,
      is_auto_generated: true,
      linked_debt_id: debtForPayment.id,
      auto_kind: 'debt_income',
    });
    if (incErr) throw incErr;

    // 2. Tạo expense tự động bên B (nếu linked)
    let expenseTxId: string | null = null;
    if (debtForPayment.debtorType === 'linked' && debtForPayment.debtorProfileId) {
      expenseTxId = uuidv4();
      const { error: expErr } = await supabase.from('transactions').insert({
        id: expenseTxId,
        profile_id: debtForPayment.debtorProfileId,
        type: 'expense',
        title: `Trả nợ: ${debtForPayment.creditorName}${debtForPayment.note ? ` — ${debtForPayment.note}` : ''}`,
        amount: payment.amount,
        source: payment.paymentSource ?? 'bank',
        category: 'none',
        note: payment.note ?? '',
        date: now,
        is_auto_generated: true,
        linked_debt_id: debtForPayment.id,
        auto_kind: 'debt_expense',
      });
      if (expErr) console.error('insert expense for debtor:', expErr);
    }

    // 3. Update payment với confirmed_at + tx links
    await supabase.from('shared_debt_payments').update({
      confirmed_at: now,
      income_transaction_id: incomeTxId,
      expense_transaction_id: expenseTxId,
    }).eq('id', paymentId);

    // 4. Update debt remaining + status
    const newRemaining = Math.max(0, debtForPayment.remainingAmount - payment.amount);
    const newStatus = newRemaining === 0 ? 'settled' : 'active';
    const settledAt = newRemaining === 0 ? now : null;
    await supabase.from('shared_debts').update({
      remaining_amount: newRemaining,
      status: newStatus,
      settled_at: settledAt,
    }).eq('id', debtForPayment.id);

    // 5. Notif về B
    if (debtForPayment.debtorUserId) {
      await pushNotification({
        recipientUserId: debtForPayment.debtorUserId,
        type: 'payment_confirmed',
        sharedDebtId: debtForPayment.id,
        actorName: me?.name ?? 'Người cho vay',
        amount: payment.amount,
        message: `${me?.name ?? 'Người cho vay'} đã xác nhận nhận ${payment.amount.toLocaleString('vi-VN')} ₫`,
      });
    }

    // 6. Refresh local
    await get().refreshSharedDebts();
    // Refresh transactions cũng cần
    const profileData = await fetchProfileData(currentProfileId);
    set({ transactions: profileData.transactions });
  },

  denyPayment: async (paymentId) => {
    const { sharedDebts, profiles, currentProfileId } = get();
    let debtForPayment: SharedDebt | undefined;
    let payment;
    for (const d of sharedDebts) {
      const p = d.payments?.find(x => x.id === paymentId);
      if (p) { debtForPayment = d; payment = p; break; }
    }
    if (!debtForPayment || !payment) return;
    const me = profiles.find(p => p.id === currentProfileId);

    // Xoá payment, trả debt về active
    await supabase.from('shared_debt_payments').delete().eq('id', paymentId);
    await supabase.from('shared_debts').update({ status: 'active' }).eq('id', debtForPayment.id);

    if (debtForPayment.debtorUserId) {
      await pushNotification({
        recipientUserId: debtForPayment.debtorUserId,
        type: 'payment_denied',
        sharedDebtId: debtForPayment.id,
        actorName: me?.name ?? 'Người cho vay',
        amount: payment.amount,
        message: `${me?.name ?? 'Người cho vay'} báo chưa nhận được ${payment.amount.toLocaleString('vi-VN')} ₫`,
      });
    }

    set({
      sharedDebts: sharedDebts.map(d => d.id === debtForPayment!.id
        ? { ...d, status: 'active', payments: (d.payments ?? []).filter(p => p.id !== paymentId) }
        : d),
    });
  },

  manualSettle: async (id, amount, source, note) => {
    const { sharedDebts, currentProfileId } = get();
    if (!currentProfileId) return;
    const debt = sharedDebts.find(d => d.id === id);
    if (!debt || debt.debtorType !== 'unlinked') return;

    const now = new Date().toISOString();
    const paymentId = uuidv4();
    const incomeTxId = uuidv4();

    // 1. Payment
    await supabase.from('shared_debt_payments').insert({
      id: paymentId, shared_debt_id: id, amount, payment_source: source,
      paid_at: now, confirmed_at: now, note,
      income_transaction_id: incomeTxId,
    });

    // 2. Income tự động
    await supabase.from('transactions').insert({
      id: incomeTxId,
      profile_id: currentProfileId,
      type: 'income',
      title: `Thu nợ: ${debt.debtorName}${debt.note ? ` — ${debt.note}` : ''}`,
      amount, source, category: 'none', note,
      date: now,
      is_auto_generated: true,
      linked_debt_id: id,
      auto_kind: 'debt_income',
    });

    // 3. Update debt
    const newRemaining = Math.max(0, debt.remainingAmount - amount);
    const newStatus = newRemaining === 0 ? 'settled' : 'active';
    await supabase.from('shared_debts').update({
      remaining_amount: newRemaining,
      status: newStatus,
      settled_at: newRemaining === 0 ? now : null,
      manually_settled: newRemaining === 0,
    }).eq('id', id);

    await get().refreshSharedDebts();
    const profileData = await fetchProfileData(currentProfileId);
    set({ transactions: profileData.transactions });
  },

  refreshSharedDebts: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const data = await fetchUserScopedData(user.id);
    set({ sharedDebts: data.sharedDebts, notifications: data.notifications, debtContacts: data.debtContacts });
  },

  // ── Notifications ───────────────────────────────────────
  fetchNotifications: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('debt_notifications')
      .select('*')
      .eq('recipient_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    set({ notifications: (data ?? []).map(toDebtNotification) });
  },

  markNotifRead: async (id) => {
    const { notifications } = get();
    await supabase.from('debt_notifications').update({ is_read: true }).eq('id', id);
    set({ notifications: notifications.map(n => n.id === id ? { ...n, isRead: true } : n) });
  },

  markAllNotifsRead: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { notifications } = get();
    if (!user) return;
    await supabase.from('debt_notifications').update({ is_read: true }).eq('recipient_user_id', user.id).eq('is_read', false);
    set({ notifications: notifications.map(n => ({ ...n, isRead: true })) });
  },

  // ── User search & contacts ──────────────────────────────
  searchUsers: async (query) => {
    const q = query.trim();
    if (q.length < 1) return [];
    const { data, error } = await supabase.rpc('search_users_for_debt', { q });
    if (error) { console.error('searchUsers:', error); return []; }
    return (data ?? []).map((r: { user_id: string; profile_id: string; name: string; email: string | null; avatar_color: string; initial: string }) => ({
      userId: r.user_id,
      profileId: r.profile_id,
      name: r.name,
      email: r.email,
      avatarColor: r.avatar_color,
      initial: r.initial,
    }));
  },

  refreshContacts: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('debt_contacts').select('*')
      .eq('owner_user_id', user.id)
      .order('last_used_at', { ascending: false })
      .limit(20);
    set({ debtContacts: (data ?? []).map(toDebtContact) });
  },

  recordContact: async (input) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert: nếu tồn tại update last_used_at, không thì insert
    const now = new Date().toISOString();
    if (input.contactUserId) {
      const { data: existing } = await supabase.from('debt_contacts').select('id')
        .eq('owner_user_id', user.id)
        .eq('contact_user_id', input.contactUserId)
        .maybeSingle();
      if (existing) {
        await supabase.from('debt_contacts').update({ last_used_at: now }).eq('id', existing.id);
      } else {
        await supabase.from('debt_contacts').insert({
          owner_user_id: user.id,
          contact_user_id: input.contactUserId,
          contact_name: input.contactName.trim(),
          contact_email: input.contactEmail ?? null,
          contact_type: input.contactType,
          last_used_at: now,
        });
      }
    } else {
      const { data: existing } = await supabase.from('debt_contacts').select('id')
        .eq('owner_user_id', user.id)
        .is('contact_user_id', null)
        .ilike('contact_name', input.contactName.trim())
        .maybeSingle();
      if (existing) {
        await supabase.from('debt_contacts').update({ last_used_at: now }).eq('id', existing.id);
      } else {
        await supabase.from('debt_contacts').insert({
          owner_user_id: user.id,
          contact_user_id: null,
          contact_name: input.contactName.trim(),
          contact_email: input.contactEmail ?? null,
          contact_type: input.contactType,
          last_used_at: now,
        });
      }
    }
    await get().refreshContacts();
  },
}));
