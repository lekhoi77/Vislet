import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  UserProfile, Transaction, CustomSource, CustomCategory,
  SharedExpense, SharedExpenseNotification, SharedExpenseContact, UserSearchResult,
} from '@/lib/types';
import { AVATAR_COLORS } from '@/lib/constants';
import { DEFAULT_SOURCES, DEFAULT_GOALS } from '@/lib/defaults';
import {
  supabase,
  toProfile,
  toTransaction,
  toCustomSource,
  toCustomCategory,
  toSharedExpense,
  toSharedExpenseNotification,
  toSharedExpenseContact,
  SharedExpenseRow,
} from '@/lib/supabase';

const CURRENT_KEY_PREFIX = 'viapp_current_';
const CURRENT_KEY_LEGACY = 'viapp_current';

/** Default IDs (bank/cash/saving/...) là chuỗi text, không phải UUID — nên insert
 *  vào DB (cột UUID) sẽ luôn fail. Chúng chỉ tồn tại trong local state.
 *  → Khi xoá, BỎ QUA call Supabase để tránh lỗi 22P02 (invalid uuid syntax). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isPersistedId(id: string): boolean {
  return UUID_RE.test(id);
}

/** Track which default (non-UUID) ids the user has removed/edited per profile.
 *  Stored in localStorage so deletions persist across refresh.
 *  Key: viapp_removed_defaults_<profileId>_<kind> → string[] of removed ids
 *  Key: viapp_overrides_<profileId>_<kind> → Record<id, {label, icon}> */
const RM_KEY = (profileId: string, kind: 'src' | 'cat') => `viapp_removed_${kind}_${profileId}`;
const OV_KEY = (profileId: string, kind: 'src' | 'cat') => `viapp_overrides_${kind}_${profileId}`;

function getRemovedDefaultIds(profileId: string, kind: 'src' | 'cat'): Set<string> {
  try {
    const raw = localStorage.getItem(RM_KEY(profileId, kind));
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch { return new Set(); }
}
function addRemovedDefaultId(profileId: string, kind: 'src' | 'cat', id: string): void {
  const set = getRemovedDefaultIds(profileId, kind);
  set.add(id);
  try { localStorage.setItem(RM_KEY(profileId, kind), JSON.stringify([...set])); } catch { /* noop */ }
}
function getDefaultOverrides(profileId: string, kind: 'src' | 'cat'): Record<string, { label: string; icon: string }> {
  try {
    const raw = localStorage.getItem(OV_KEY(profileId, kind));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function setDefaultOverride(profileId: string, kind: 'src' | 'cat', id: string, label: string, icon: string): void {
  const cur = getDefaultOverrides(profileId, kind);
  cur[id] = { label, icon };
  try { localStorage.setItem(OV_KEY(profileId, kind), JSON.stringify(cur)); } catch { /* noop */ }
}

function getStoredProfileId(userId: string): string | null {
  try {
    return localStorage.getItem(CURRENT_KEY_PREFIX + userId)
        ?? localStorage.getItem(CURRENT_KEY_LEGACY);
  } catch { return null; }
}
function setStoredProfileId(userId: string, profileId: string): void {
  try { localStorage.setItem(CURRENT_KEY_PREFIX + userId, profileId); } catch { /* noop */ }
}

async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('getCurrentUser(getSession):', error);
      return null;
    }
    return session?.user ?? null;
  } catch (error) {
    console.error('getCurrentUser:', error);
    return null;
  }
}

interface NewSharedExpenseInput {
  // Tx của A (current user) — đã có sẵn nếu tạo từ TransactionForm split.
  // Nếu null → đây là "ghi chi chung" thuần (không gắn expense).
  sourceTransactionId?: string | null;
  totalExpense: number;
  splitAmount: number;

  participantType: 'linked' | 'unlinked';
  participantUserId?: string | null;
  participantProfileId?: string | null;
  participantName: string;
  participantEmail?: string | null;

  direction: 'forward' | 'reverse'; // forward = họ cần trả tôi; reverse = tôi cần trả họ
  note: string;
  category: string;
  dueDate?: string | null;
}

interface AppState {
  profiles: UserProfile[];
  currentProfileId: string | null;
  transactions: Transaction[];
  sharedExpenses: SharedExpense[];
  notifications: SharedExpenseNotification[];
  sharedExpenseContacts: SharedExpenseContact[];
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
  updateCustomSource: (id: string, label: string, icon: string) => Promise<void>;
  reorderCustomSources: (orderedIds: string[]) => void;
  addCustomCategory: (label: string, icon: string) => Promise<void>;
  removeCustomCategory: (id: string) => Promise<void>;
  updateCustomCategory: (id: string, label: string, icon: string) => Promise<void>;
  reorderCustomCategories: (orderedIds: string[]) => void;

  // Shared expenses ("Chi chung")
  createSharedExpense: (input: NewSharedExpenseInput) => Promise<SharedExpense>;
  acceptSharedExpense: (id: string) => Promise<void>;
  rejectSharedExpense: (id: string, reason?: string) => Promise<void>;
  cancelSharedExpense: (id: string) => Promise<void>;
  deleteSharedExpense: (id: string) => Promise<void>;
  claimPayment: (id: string, amount: number, paymentSource: string, note: string) => Promise<void>;
  confirmPayment: (paymentId: string) => Promise<void>;
  denyPayment: (paymentId: string) => Promise<void>;
  manualSettle: (id: string, amount: number, source: string, note: string) => Promise<void>;
  refreshSharedExpenses: () => Promise<void>;

  // Notifications
  fetchNotifications: () => Promise<void>;
  markNotifRead: (id: string) => Promise<void>;
  markAllNotifsRead: () => Promise<void>;

  // User search & contacts
  searchUsers: (query: string) => Promise<UserSearchResult[]>;
  refreshContacts: () => Promise<void>;
  recordContact: (input: { contactUserId?: string | null; contactName: string; contactEmail?: string | null; contactType: 'linked' | 'unlinked' }) => Promise<void>;
}

// ─── Helper: fetch tất cả data của profile + user-level (chi chung) ───

async function fetchProfileData(profileId: string) {
  const [txRes, srcRes, catRes] = await Promise.all([
    supabase.from('transactions').select('*').eq('profile_id', profileId).order('date', { ascending: false }),
    supabase.from('sources').select('*').eq('profile_id', profileId).order('created_at', { ascending: true }),
    supabase.from('categories').select('*').eq('profile_id', profileId).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
  ]);

  let sources = (srcRes.data ?? []).map(toCustomSource);
  let categories = (catRes.data ?? []).map(toCustomCategory);

  // Seed defaults LOCAL-ONLY (DB id column is UUID — text ids như 'saving' không
  // bao giờ insert được). Lọc theo removed-default list để delete persist qua refresh.
  // Áp dụng label/icon override nếu user đã sửa.
  const removedSrc = getRemovedDefaultIds(profileId, 'src');
  const removedCat = getRemovedDefaultIds(profileId, 'cat');
  const overrideSrc = getDefaultOverrides(profileId, 'src');
  const overrideCat = getDefaultOverrides(profileId, 'cat');

  const defaultSrcRows = DEFAULT_SOURCES
    .filter(s => !removedSrc.has(s.id))
    .map(s => {
      const ov = overrideSrc[s.id];
      return { id: s.id, label: ov?.label ?? s.label, icon: ov?.icon ?? s.icon, createdAt: '' };
    });
  const defaultCatRows = DEFAULT_GOALS
    .filter(g => !removedCat.has(g.id))
    .map(g => {
      const ov = overrideCat[g.id];
      return { id: g.id, label: ov?.label ?? g.label, icon: ov?.icon ?? g.icon, createdAt: '' };
    });

  // Loại trùng ID + trùng TÊN (phòng trường hợp legacy DB từng insert được trước
  // đây — profile cũ có thể đã có sẵn dòng thật "Ngân hàng"/"Tiết kiệm"/... với
  // UUID riêng, khớp ID sẽ không bắt được nên phải so thêm theo label).
  const dbSrcIds = new Set(sources.map(s => s.id));
  const dbSrcLabels = new Set(sources.map(s => s.label.trim().toLowerCase()));
  const dbCatIds = new Set(categories.map(c => c.id));
  const dbCatLabels = new Set(categories.map(c => c.label.trim().toLowerCase()));
  sources = [...defaultSrcRows.filter(d => !dbSrcIds.has(d.id) && !dbSrcLabels.has(d.label.trim().toLowerCase())), ...sources];
  categories = [...defaultCatRows.filter(d => !dbCatIds.has(d.id) && !dbCatLabels.has(d.label.trim().toLowerCase())), ...categories];

  return {
    transactions: (txRes.data ?? []).map(toTransaction),
    customSources: sources,
    customCategories: categories,
  };
}

async function fetchUserScopedData(userId: string) {
  const [expensesRes, paymentsRes, notifRes, contactsRes] = await Promise.all([
    supabase.from('shared_expenses').select('*').or(`owner_user_id.eq.${userId},participant_user_id.eq.${userId}`).order('created_at', { ascending: false }),
    supabase.from('shared_expense_payments').select('*').order('paid_at', { ascending: false }),
    supabase.from('shared_expense_notifications').select('*').eq('recipient_user_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('shared_expense_contacts').select('*').eq('owner_user_id', userId).order('last_used_at', { ascending: false }).limit(20),
  ]);
  return {
    sharedExpenses: (expensesRes.data ?? []).map(e => toSharedExpense(e, (paymentsRes.data ?? []).filter(p => p.shared_expense_id === e.id))),
    notifications: (notifRes.data ?? []).map(toSharedExpenseNotification),
    sharedExpenseContacts: (contactsRes.data ?? []).map(toSharedExpenseContact),
  };
}

// ─── Helper: tạo notification cho user khác ────────────────
async function pushNotification(input: {
  recipientUserId: string;
  type: string;
  sharedExpenseId: string;
  actorName: string;
  amount: number;
  message: string;
}) {
  const { error } = await supabase.from('shared_expense_notifications').insert({
    id: uuidv4(),
    recipient_user_id: input.recipientUserId,
    type: input.type,
    shared_expense_id: input.sharedExpenseId,
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
  sharedExpenses: [],
  notifications: [],
  sharedExpenseContacts: [],
  customSources: [],
  customCategories: [],
  isLoaded: false,
  isLoading: false,

  initApp: async () => {
    set({ isLoading: true });

    const user = await getCurrentUser();
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
    const user = await getCurrentUser();
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

    // Defaults là local-only (DB schema dùng UUID, text id không insert được).
    // Chúng được seed lại từ fetchProfileData mỗi lần load.

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
      customSources: DEFAULT_SOURCES.map(s => ({ id: s.id, label: s.label, icon: s.icon, createdAt: '' })),
      customCategories: DEFAULT_GOALS.map(g => ({ id: g.id, label: g.label, icon: g.icon, createdAt: '' })),
    });
  },

  switchProfile: async (id: string) => {
    const { profiles } = get();
    if (!profiles.find(p => p.id === id)) return;
    set({ isLoading: true });
    const user = await getCurrentUser();
    const profileData = await fetchProfileData(id);
    if (user) setStoredProfileId(user.id, id);
    set({ currentProfileId: id, ...profileData, isLoading: false });
  },

  deleteProfile: async (id: string) => {
    const { profiles, currentProfileId } = get();
    if (profiles.length <= 1) return;
    const user = await getCurrentUser();
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
    const row: Record<string, unknown> = {
      id, profile_id: currentProfileId,
      type: txData.type, title: txData.title, amount: txData.amount,
      source: txData.source, category: txData.category, note: txData.note ?? '',
      date: txData.date,
      is_auto_generated: txData.isAutoGenerated ?? false,
      linked_shared_expense_id: txData.linkedSharedExpenseId ?? null,
      auto_kind: txData.autoKind ?? null,
    };
    if (txData.excludedFromReports) row.excluded_from_reports = true;

    const { error } = await supabase.from('transactions').insert(row);
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
    if (data.excludedFromReports !== undefined) dbData.excluded_from_reports = data.excludedFromReports;
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
    const { customSources, currentProfileId } = get();
    if (isPersistedId(id)) {
      const { error } = await supabase.from('sources').delete().eq('id', id);
      if (error) { console.error('removeCustomSource:', error); throw error; }
    } else if (currentProfileId) {
      // Default local-only — nhớ id đã xoá để không seed lại lần sau
      addRemovedDefaultId(currentProfileId, 'src', id);
    }
    set({ customSources: customSources.filter(s => s.id !== id) });
  },
  updateCustomSource: async (id, label, icon) => {
    const { customSources, currentProfileId } = get();
    if (isPersistedId(id)) {
      const { error } = await supabase.from('sources').update({ label: label.trim(), icon }).eq('id', id);
      if (error) throw error;
    } else if (currentProfileId) {
      // Default local-only — lưu override để persist qua refresh
      setDefaultOverride(currentProfileId, 'src', id, label.trim(), icon);
    }
    set({ customSources: customSources.map(s => s.id === id ? { ...s, label: label.trim(), icon } : s) });
  },
  reorderCustomSources: (orderedIds) => {
    const { customSources } = get();
    const map = new Map(customSources.map(s => [s.id, s]));
    set({ customSources: orderedIds.map(id => map.get(id)!).filter(Boolean) });
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
    const { customCategories, currentProfileId } = get();
    if (isPersistedId(id)) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) { console.error('removeCustomCategory:', error); throw error; }
    } else if (currentProfileId) {
      addRemovedDefaultId(currentProfileId, 'cat', id);
    }
    set({ customCategories: customCategories.filter(c => c.id !== id) });
  },
  updateCustomCategory: async (id, label, icon) => {
    const { customCategories, currentProfileId } = get();
    if (isPersistedId(id)) {
      const { error } = await supabase.from('categories').update({ label: label.trim(), icon }).eq('id', id);
      if (error) throw error;
    } else if (currentProfileId) {
      setDefaultOverride(currentProfileId, 'cat', id, label.trim(), icon);
    }
    set({ customCategories: customCategories.map(c => c.id === id ? { ...c, label: label.trim(), icon } : c) });
  },
  reorderCustomCategories: (orderedIds) => {
    const { customCategories } = get();
    const map = new Map(customCategories.map(c => [c.id, c]));
    const reordered = orderedIds.map(id => map.get(id)!).filter(Boolean);
    set({ customCategories: reordered });
    reordered.forEach((c, idx) => {
      supabase.from('categories').update({ sort_order: idx }).eq('id', c.id);
    });
  },

  // ── Shared Expenses ("Chi chung") ───────────────────────
  createSharedExpense: async (input) => {
    const user = await getCurrentUser();
    const { currentProfileId, profiles, sharedExpenses } = get();
    if (!user || !currentProfileId) throw new Error('Chưa đăng nhập');

    const me = profiles.find(p => p.id === currentProfileId);
    const id = uuidv4();
    const status: 'pending' | 'active' = input.participantType === 'linked' ? 'pending' : 'active';

    const row: SharedExpenseRow = {
      id,
      owner_user_id: user.id,
      owner_profile_id: currentProfileId,
      owner_name: me?.name ?? 'Bạn',
      participant_type: input.participantType,
      participant_user_id: input.participantUserId ?? null,
      participant_profile_id: input.participantProfileId ?? null,
      participant_name: input.participantName.trim(),
      participant_email: input.participantEmail ?? null,
      direction: input.direction,
      total_expense: input.totalExpense,
      split_amount: input.splitAmount,
      remaining_amount: input.splitAmount,
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

    const { error } = await supabase.from('shared_expenses').insert(row);
    if (error) throw new Error(error.message || 'Không thể tạo khoản chi chung');

    // Notification cho người cùng chia (linked)
    if (input.participantType === 'linked' && input.participantUserId) {
      const amt = input.splitAmount.toLocaleString('vi-VN');
      await pushNotification({
        recipientUserId: input.participantUserId,
        type: 'split_request',
        sharedExpenseId: id,
        actorName: me?.name ?? 'Người dùng',
        amount: input.splitAmount,
        message: `${me?.name ?? 'Một người dùng'} muốn ghi nhận bạn cần trả ${amt} ₫${input.note ? ` cho: ${input.note}` : ''}`,
      });
    }

    // Lưu contact
    await get().recordContact({
      contactUserId: input.participantUserId ?? null,
      contactName: input.participantName,
      contactEmail: input.participantEmail ?? null,
      contactType: input.participantType,
    });

    const expense = toSharedExpense(row);
    set({ sharedExpenses: [expense, ...sharedExpenses] });
    return expense;
  },

  acceptSharedExpense: async (id) => {
    const user = await getCurrentUser();
    const { sharedExpenses, profiles, currentProfileId } = get();
    if (!user) return;
    const expense = sharedExpenses.find(e => e.id === id);
    if (!expense) return;
    const me = profiles.find(p => p.id === currentProfileId);

    const acceptedAt = new Date().toISOString();
    const { error } = await supabase.from('shared_expenses').update({
      status: 'active',
      accepted_at: acceptedAt,
      participant_profile_id: currentProfileId,
      participant_name: me?.name ?? expense.participantName,
    }).eq('id', id);
    if (error) { console.error('acceptSharedExpense:', error); throw error; }

    await pushNotification({
      recipientUserId: expense.ownerUserId,
      type: 'split_accepted',
      sharedExpenseId: id,
      actorName: me?.name ?? 'Người dùng',
      amount: expense.splitAmount,
      message: `${me?.name ?? 'Người cùng chia'} đã xác nhận khoản chi chung ${expense.splitAmount.toLocaleString('vi-VN')} ₫`,
    });

    set({
      sharedExpenses: sharedExpenses.map(e => e.id === id ? { ...e, status: 'active', acceptedAt, participantProfileId: currentProfileId, participantName: me?.name ?? e.participantName } : e),
    });
  },

  rejectSharedExpense: async (id, reason) => {
    const { sharedExpenses, profiles, currentProfileId } = get();
    const expense = sharedExpenses.find(e => e.id === id);
    if (!expense) return;
    const me = profiles.find(p => p.id === currentProfileId);

    const { error } = await supabase.from('shared_expenses').update({
      status: 'rejected',
      reject_reason: reason?.trim() || null,
    }).eq('id', id);
    if (error) { console.error('rejectSharedExpense:', error); throw error; }

    await pushNotification({
      recipientUserId: expense.ownerUserId,
      type: 'split_rejected',
      sharedExpenseId: id,
      actorName: me?.name ?? 'Người dùng',
      amount: expense.splitAmount,
      message: `${me?.name ?? 'Người cùng chia'} đã từ chối khoản chi chung${reason ? ` (lý do: ${reason})` : ''}`,
    });

    set({ sharedExpenses: sharedExpenses.map(e => e.id === id ? { ...e, status: 'rejected', rejectReason: reason ?? null } : e) });
  },

  cancelSharedExpense: async (id) => {
    const { sharedExpenses } = get();
    const expense = sharedExpenses.find(e => e.id === id);
    if (!expense || expense.status !== 'pending') return;
    const { error } = await supabase.from('shared_expenses').update({ status: 'cancelled' }).eq('id', id);
    if (error) { console.error('cancelSharedExpense:', error); return; }
    if (expense.participantUserId) {
      await pushNotification({
        recipientUserId: expense.participantUserId,
        type: 'split_cancelled',
        sharedExpenseId: id,
        actorName: expense.ownerName,
        amount: expense.splitAmount,
        message: `${expense.ownerName} đã huỷ yêu cầu chia chi phí ${expense.splitAmount.toLocaleString('vi-VN')} ₫`,
      });
    }
    set({ sharedExpenses: sharedExpenses.map(e => e.id === id ? { ...e, status: 'cancelled' } : e) });
  },

  deleteSharedExpense: async (id) => {
    const { sharedExpenses } = get();
    const { error } = await supabase.from('shared_expenses').delete().eq('id', id);
    if (error) { console.error('deleteSharedExpense:', error); return; }
    set({ sharedExpenses: sharedExpenses.filter(e => e.id !== id) });
  },

  claimPayment: async (id, amount, paymentSource, note) => {
    const { sharedExpenses, profiles, currentProfileId } = get();
    const expense = sharedExpenses.find(e => e.id === id);
    if (!expense) return;
    const me = profiles.find(p => p.id === currentProfileId);

    const paymentId = uuidv4();
    const paidAt = new Date().toISOString();

    const { error: pErr } = await supabase.from('shared_expense_payments').insert({
      id: paymentId, shared_expense_id: id, amount, payment_source: paymentSource,
      paid_at: paidAt, note,
    });
    if (pErr) throw pErr;

    const { error: sErr } = await supabase.from('shared_expenses').update({ status: 'pending_confirm' }).eq('id', id);
    if (sErr) throw sErr;

    await pushNotification({
      recipientUserId: expense.ownerUserId,
      type: 'payment_claimed',
      sharedExpenseId: id,
      actorName: me?.name ?? 'Người cùng chia',
      amount,
      message: `${me?.name ?? 'Người cùng chia'} nói đã trả ${amount.toLocaleString('vi-VN')} ₫${note ? ` — "${note}"` : ''}`,
    });

    const newPayment = {
      id: paymentId, sharedExpenseId: id, amount, paymentSource,
      paidAt, confirmedAt: null, note, incomeTransactionId: null, expenseTransactionId: null,
    };
    set({
      sharedExpenses: sharedExpenses.map(e => e.id === id
        ? { ...e, status: 'pending_confirm', payments: [...(e.payments ?? []), newPayment] }
        : e),
    });
  },

  confirmPayment: async (paymentId) => {
    const user = await getCurrentUser();
    const { sharedExpenses, profiles, currentProfileId } = get();
    if (!user || !currentProfileId) return;

    // Tìm payment + expense
    let expenseForPayment: SharedExpense | undefined;
    let payment;
    for (const e of sharedExpenses) {
      const p = e.payments?.find(x => x.id === paymentId);
      if (p) { expenseForPayment = e; payment = p; break; }
    }
    if (!expenseForPayment || !payment) return;
    const me = profiles.find(p => p.id === currentProfileId);
    const now = new Date().toISOString();

    // 1. Tạo income tự động bên chủ chi tiêu (owner)
    const incomeTxId = uuidv4();
    const incomeTitle = `Thu chi chung: ${expenseForPayment.participantName}${expenseForPayment.note ? ` — ${expenseForPayment.note}` : ''}`;
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
      linked_shared_expense_id: expenseForPayment.id,
      auto_kind: 'split_income',
    });
    if (incErr) throw incErr;

    // 2. Tạo expense tự động bên người cùng chia (nếu linked)
    let expenseTxId: string | null = null;
    if (expenseForPayment.participantType === 'linked' && expenseForPayment.participantProfileId) {
      expenseTxId = uuidv4();
      const { error: expErr } = await supabase.from('transactions').insert({
        id: expenseTxId,
        profile_id: expenseForPayment.participantProfileId,
        type: 'expense',
        title: `Trả chi chung: ${expenseForPayment.ownerName}${expenseForPayment.note ? ` — ${expenseForPayment.note}` : ''}`,
        amount: payment.amount,
        source: payment.paymentSource ?? 'bank',
        category: 'none',
        note: payment.note ?? '',
        date: now,
        is_auto_generated: true,
        linked_shared_expense_id: expenseForPayment.id,
        auto_kind: 'split_expense',
      });
      if (expErr) console.error('insert expense for participant:', expErr);
    }

    // 3. Update payment với confirmed_at + tx links
    await supabase.from('shared_expense_payments').update({
      confirmed_at: now,
      income_transaction_id: incomeTxId,
      expense_transaction_id: expenseTxId,
    }).eq('id', paymentId);

    // 4. Update expense remaining + status
    const newRemaining = Math.max(0, expenseForPayment.remainingAmount - payment.amount);
    const newStatus = newRemaining === 0 ? 'settled' : 'active';
    const settledAt = newRemaining === 0 ? now : null;
    await supabase.from('shared_expenses').update({
      remaining_amount: newRemaining,
      status: newStatus,
      settled_at: settledAt,
    }).eq('id', expenseForPayment.id);

    // 5. Notif về người cùng chia
    if (expenseForPayment.participantUserId) {
      await pushNotification({
        recipientUserId: expenseForPayment.participantUserId,
        type: 'payment_confirmed',
        sharedExpenseId: expenseForPayment.id,
        actorName: me?.name ?? 'Người trả trước',
        amount: payment.amount,
        message: `${me?.name ?? 'Người trả trước'} đã xác nhận nhận ${payment.amount.toLocaleString('vi-VN')} ₫`,
      });
    }

    // 6. Refresh local
    await get().refreshSharedExpenses();
    // Refresh transactions cũng cần
    const profileData = await fetchProfileData(currentProfileId);
    set({ transactions: profileData.transactions });
  },

  denyPayment: async (paymentId) => {
    const { sharedExpenses, profiles, currentProfileId } = get();
    let expenseForPayment: SharedExpense | undefined;
    let payment;
    for (const e of sharedExpenses) {
      const p = e.payments?.find(x => x.id === paymentId);
      if (p) { expenseForPayment = e; payment = p; break; }
    }
    if (!expenseForPayment || !payment) return;
    const me = profiles.find(p => p.id === currentProfileId);

    // Xoá payment, trả expense về active
    await supabase.from('shared_expense_payments').delete().eq('id', paymentId);
    await supabase.from('shared_expenses').update({ status: 'active' }).eq('id', expenseForPayment.id);

    if (expenseForPayment.participantUserId) {
      await pushNotification({
        recipientUserId: expenseForPayment.participantUserId,
        type: 'payment_denied',
        sharedExpenseId: expenseForPayment.id,
        actorName: me?.name ?? 'Người trả trước',
        amount: payment.amount,
        message: `${me?.name ?? 'Người trả trước'} báo chưa nhận được ${payment.amount.toLocaleString('vi-VN')} ₫`,
      });
    }

    set({
      sharedExpenses: sharedExpenses.map(e => e.id === expenseForPayment!.id
        ? { ...e, status: 'active', payments: (e.payments ?? []).filter(p => p.id !== paymentId) }
        : e),
    });
  },

  manualSettle: async (id, amount, source, note) => {
    const { sharedExpenses, currentProfileId } = get();
    if (!currentProfileId) return;
    const expense = sharedExpenses.find(e => e.id === id);
    if (!expense || expense.participantType !== 'unlinked') return;

    const now = new Date().toISOString();
    const paymentId = uuidv4();
    const incomeTxId = uuidv4();

    // 1. Payment
    await supabase.from('shared_expense_payments').insert({
      id: paymentId, shared_expense_id: id, amount, payment_source: source,
      paid_at: now, confirmed_at: now, note,
      income_transaction_id: incomeTxId,
    });

    // 2. Income tự động
    await supabase.from('transactions').insert({
      id: incomeTxId,
      profile_id: currentProfileId,
      type: 'income',
      title: `Thu chi chung: ${expense.participantName}${expense.note ? ` — ${expense.note}` : ''}`,
      amount, source, category: 'none', note,
      date: now,
      is_auto_generated: true,
      linked_shared_expense_id: id,
      auto_kind: 'split_income',
    });

    // 3. Update expense
    const newRemaining = Math.max(0, expense.remainingAmount - amount);
    const newStatus = newRemaining === 0 ? 'settled' : 'active';
    await supabase.from('shared_expenses').update({
      remaining_amount: newRemaining,
      status: newStatus,
      settled_at: newRemaining === 0 ? now : null,
      manually_settled: newRemaining === 0,
    }).eq('id', id);

    await get().refreshSharedExpenses();
    const profileData = await fetchProfileData(currentProfileId);
    set({ transactions: profileData.transactions });
  },

  refreshSharedExpenses: async () => {
    const user = await getCurrentUser();
    if (!user) return;
    const data = await fetchUserScopedData(user.id);
    set({ sharedExpenses: data.sharedExpenses, notifications: data.notifications, sharedExpenseContacts: data.sharedExpenseContacts });
  },

  // ── Notifications ───────────────────────────────────────
  fetchNotifications: async () => {
    const user = await getCurrentUser();
    if (!user) return;
    const { data } = await supabase
      .from('shared_expense_notifications')
      .select('*')
      .eq('recipient_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    set({ notifications: (data ?? []).map(toSharedExpenseNotification) });
  },

  markNotifRead: async (id) => {
    const { notifications } = get();
    await supabase.from('shared_expense_notifications').update({ is_read: true }).eq('id', id);
    set({ notifications: notifications.map(n => n.id === id ? { ...n, isRead: true } : n) });
  },

  markAllNotifsRead: async () => {
    const user = await getCurrentUser();
    const { notifications } = get();
    if (!user) return;
    await supabase.from('shared_expense_notifications').update({ is_read: true }).eq('recipient_user_id', user.id).eq('is_read', false);
    set({ notifications: notifications.map(n => ({ ...n, isRead: true })) });
  },

  // ── User search & contacts ──────────────────────────────
  searchUsers: async (query) => {
    const q = query.trim();
    if (q.length < 1) return [];
    const { data, error } = await supabase.rpc('search_users_for_split', { q });
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
    const user = await getCurrentUser();
    if (!user) return;
    const { data } = await supabase.from('shared_expense_contacts').select('*')
      .eq('owner_user_id', user.id)
      .order('last_used_at', { ascending: false })
      .limit(20);
    set({ sharedExpenseContacts: (data ?? []).map(toSharedExpenseContact) });
  },

  recordContact: async (input) => {
    const user = await getCurrentUser();
    if (!user) return;

    // Upsert: nếu tồn tại update last_used_at, không thì insert
    const now = new Date().toISOString();
    if (input.contactUserId) {
      const { data: existing } = await supabase.from('shared_expense_contacts').select('id')
        .eq('owner_user_id', user.id)
        .eq('contact_user_id', input.contactUserId)
        .maybeSingle();
      if (existing) {
        await supabase.from('shared_expense_contacts').update({ last_used_at: now }).eq('id', existing.id);
      } else {
        await supabase.from('shared_expense_contacts').insert({
          owner_user_id: user.id,
          contact_user_id: input.contactUserId,
          contact_name: input.contactName.trim(),
          contact_email: input.contactEmail ?? null,
          contact_type: input.contactType,
          last_used_at: now,
        });
      }
    } else {
      const { data: existing } = await supabase.from('shared_expense_contacts').select('id')
        .eq('owner_user_id', user.id)
        .is('contact_user_id', null)
        .ilike('contact_name', input.contactName.trim())
        .maybeSingle();
      if (existing) {
        await supabase.from('shared_expense_contacts').update({ last_used_at: now }).eq('id', existing.id);
      } else {
        await supabase.from('shared_expense_contacts').insert({
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
