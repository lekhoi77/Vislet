import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, Transaction, Debt, CustomSource, CustomBudget } from '@/lib/types';
import { AVATAR_COLORS } from '@/lib/constants';
import { DEFAULT_SOURCES, DEFAULT_GOALS } from '@/lib/defaults';
import { mergeSources, mergeGoals, isDefaultSourceId, isDefaultGoalId } from '@/lib/catalog';
import {
  PROTECTED_GOAL_ID,
  isProtectedGoalId,
  sanitizeRemovedGoalIds,
  countTransactionsByGoal,
  countTransactionsBySource,
  pickFallbackSourceId,
} from '@/lib/catalog-policy';
import { storage } from '@/lib/storage';
import {
  supabase,
  toProfile,
  toTransaction,
  toDebt,
  toCustomSource,
  toCustomBudget,
} from '@/lib/supabase';

// localStorage chỉ lưu currentProfileId (client-side preference)
// Key theo user để tránh cross-user bleed; fallback key cũ để tương thích
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

interface AppState {
  profiles: UserProfile[];
  currentProfileId: string | null;
  transactions: Transaction[];
  debts: Debt[];
  customSources: CustomSource[];
  customBudgets: CustomBudget[];
  sourcesDb: CustomSource[];
  goalsDb: CustomBudget[];
  removedSourceIds: string[];
  removedGoalIds: string[];
  isLoaded: boolean;
  isLoading: boolean;

  // Actions
  initApp: () => Promise<void>;
  createProfile: (name: string) => Promise<void>;
  switchProfile: (id: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;

  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'settled' | 'settledAt'>) => Promise<void>;
  updateDebt: (id: string, data: Partial<Omit<Debt, 'id' | 'createdAt'>>) => Promise<void>;
  settleDebt: (id: string) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  addCustomSource: (label: string, icon?: string) => Promise<void>;
  updateCustomSource: (id: string, data: { label?: string; icon?: string }) => Promise<void>;
  removeCustomSource: (id: string) => Promise<{ reassigned: number }>;

  addCustomBudget: (label: string, icon: string) => Promise<void>;
  updateCustomBudget: (id: string, data: { label?: string; icon?: string }) => Promise<void>;
  removeCustomBudget: (id: string) => Promise<{ reassigned: number }>;
}

function applyCatalog(
  sourcesDb: CustomSource[],
  goalsDb: CustomBudget[],
  removedSourceIds: string[],
  removedGoalIds: string[],
) {
  return {
    sourcesDb,
    goalsDb,
    removedSourceIds,
    removedGoalIds,
    customSources: mergeSources(sourcesDb, removedSourceIds),
    customBudgets: mergeGoals(goalsDb, removedGoalIds),
  };
}

async function seedDefaultCatalog(profileId: string) {
  await supabase.from('sources').insert(
    DEFAULT_SOURCES.map(s => ({
      id: s.id,
      profile_id: profileId,
      label: s.label,
      icon: s.icon,
      is_builtin: true,
    })),
  );
  await supabase.from('goals').insert(
    DEFAULT_GOALS.map((g, i) => ({
      id: g.id,
      profile_id: profileId,
      label: g.label,
      icon: g.icon,
      is_builtin: true,
      sort_order: i,
    })),
  );
}

// ─── Helper: fetch tất cả data của 1 profile ───────────────

async function fetchProfileData(profileId: string) {
  const [txRes, debtRes, srcRes, bdgRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', profileId)
      .order('date', { ascending: false }),
    supabase
      .from('debts')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false }),
    supabase
      .from('sources')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true }),
    supabase
      .from('goals')
      .select('*')
      .eq('profile_id', profileId)
      .order('sort_order', { ascending: true }),
  ]);

  const sourcesDb = (srcRes.data ?? []).map(toCustomSource);
  const goalsDb = (bdgRes.data ?? []).map(toCustomBudget);
  const removedSourceIds = storage.getRemovedSourceIds(profileId);
  const removedGoalIds = sanitizeRemovedGoalIds(storage.getRemovedGoalIds(profileId));

  return {
    transactions: (txRes.data ?? []).map(toTransaction),
    debts: (debtRes.data ?? []).map(toDebt),
    ...applyCatalog(sourcesDb, goalsDb, removedSourceIds, removedGoalIds),
  };
}

// ─── Store ──────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  currentProfileId: null,
  transactions: [],
  debts: [],
  customSources: [],
  customBudgets: [],
  sourcesDb: [],
  goalsDb: [],
  removedSourceIds: [],
  removedGoalIds: [],
  isLoaded: false,
  isLoading: false,

  // ── Init ────────────────────────────────────────────────
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
    const activeId = (storedId && profiles.find(p => p.id === storedId))
      ? storedId
      : profiles[0].id;

    const profileData = await fetchProfileData(activeId);
    set({ profiles, currentProfileId: activeId, ...profileData, isLoaded: true, isLoading: false });
  },

  // ── Profiles ────────────────────────────────────────────
  createProfile: async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { profiles } = get();
    const colorIndex = profiles.length % AVATAR_COLORS.length;
    const id = uuidv4();

    const { error } = await supabase.from('profiles').insert({
      id,
      user_id: user.id,
      name: name.trim(),
      avatar_color: AVATAR_COLORS[colorIndex],
      initial: name.trim().charAt(0).toUpperCase(),
    });

    if (error) { console.error('createProfile:', error); return; }

    await seedDefaultCatalog(id);

    const newProfile: UserProfile = {
      id,
      name: name.trim(),
      avatarColor: AVATAR_COLORS[colorIndex],
      initial: name.trim().charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    setStoredProfileId(user.id, id);
    const catalog = applyCatalog(
      DEFAULT_SOURCES.map(s => ({ id: s.id, label: s.label, icon: s.icon, createdAt: new Date().toISOString() })),
      DEFAULT_GOALS.map(g => ({ id: g.id, label: g.label, icon: g.icon, createdAt: new Date().toISOString() })),
      [],
      [],
    );
    set({
      profiles: [...profiles, newProfile],
      currentProfileId: id,
      transactions: [],
      debts: [],
      ...catalog,
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
    if (!currentProfileId) return;

    const id = uuidv4();
    const { error } = await supabase.from('transactions').insert({
      id,
      profile_id: currentProfileId,
      type: txData.type,
      title: txData.title,
      amount: txData.amount,
      source: txData.source,
      goal: txData.goal,
      note: txData.note ?? '',
      date: txData.date,
    }).select();

    if (error) {
      console.error('addTransaction error:', JSON.stringify(error), 'profile:', currentProfileId);
      throw new Error(error.message || error.details || JSON.stringify(error) || 'Lỗi không xác định');
    }

    const newTx: Transaction = { ...txData, id, createdAt: new Date().toISOString() };
    set({ transactions: [newTx, ...transactions] });
  },

  updateTransaction: async (id, data) => {
    const { currentProfileId, transactions } = get();
    if (!currentProfileId) return;

    // camelCase → snake_case
    const dbData: Record<string, unknown> = {};
    if (data.type   !== undefined) dbData.type   = data.type;
    if (data.title  !== undefined) dbData.title  = data.title;
    if (data.amount !== undefined) dbData.amount = data.amount;
    if (data.source !== undefined) dbData.source = data.source;
    if (data.goal   !== undefined) dbData.goal   = data.goal;
    if (data.note   !== undefined) dbData.note   = data.note;
    if (data.date   !== undefined) dbData.date   = data.date;

    const { error } = await supabase.from('transactions').update(dbData).eq('id', id);
    if (error) { console.error('updateTransaction:', error); return; }

    set({ transactions: transactions.map(t => t.id === id ? { ...t, ...data } : t) });
  },

  deleteTransaction: async (id) => {
    const { currentProfileId, transactions } = get();
    if (!currentProfileId) return;

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { console.error('deleteTransaction:', error); return; }

    set({ transactions: transactions.filter(t => t.id !== id) });
  },

  // ── Debts ───────────────────────────────────────────────
  addDebt: async (debtData) => {
    const { currentProfileId, debts } = get();
    if (!currentProfileId) return;

    const id = uuidv4();
    const { error } = await supabase.from('debts').insert({
      id,
      profile_id: currentProfileId,
      type: debtData.type,
      person: debtData.person,
      amount: debtData.amount,
      note: debtData.note ?? '',
      due_date: debtData.dueDate ?? null,
      settled: false,
      settled_at: null,
    });

    if (error) { console.error('addDebt:', error); return; }

    const newDebt: Debt = {
      ...debtData,
      id,
      settled: false,
      settledAt: null,
      createdAt: new Date().toISOString(),
    };
    set({ debts: [newDebt, ...debts] });
  },

  updateDebt: async (id, data) => {
    const { currentProfileId, debts } = get();
    if (!currentProfileId) return;

    const dbData: Record<string, unknown> = {};
    if (data.type      !== undefined) dbData.type       = data.type;
    if (data.person    !== undefined) dbData.person     = data.person;
    if (data.amount    !== undefined) dbData.amount     = data.amount;
    if (data.note      !== undefined) dbData.note       = data.note;
    if (data.dueDate   !== undefined) dbData.due_date   = data.dueDate;
    if (data.settled   !== undefined) dbData.settled    = data.settled;
    if (data.settledAt !== undefined) dbData.settled_at = data.settledAt;

    const { error } = await supabase.from('debts').update(dbData).eq('id', id);
    if (error) { console.error('updateDebt:', error); return; }

    set({ debts: debts.map(d => d.id === id ? { ...d, ...data } : d) });
  },

  settleDebt: async (id) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('debts')
      .update({ settled: true, settled_at: now })
      .eq('id', id);

    if (error) { console.error('settleDebt:', error); return; }

    const { debts } = get();
    set({ debts: debts.map(d => d.id === id ? { ...d, settled: true, settledAt: now } : d) });
  },

  deleteDebt: async (id) => {
    const { currentProfileId, debts } = get();
    if (!currentProfileId) return;

    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) { console.error('deleteDebt:', error); return; }

    set({ debts: debts.filter(d => d.id !== id) });
  },

  // ── Custom Sources ──────────────────────────────────────
  addCustomSource: async (label, icon = 'Wallet') => {
    const { currentProfileId, customSources } = get();
    if (!currentProfileId) return;

    const id = uuidv4();
    const { error } = await supabase.from('sources').insert({
      id,
      profile_id: currentProfileId,
      label: label.trim(),
      icon,
      is_builtin: false,
    });

    if (error) { console.error('addCustomSource:', error); return; }

    const source: CustomSource = { id, label: label.trim(), icon, createdAt: new Date().toISOString() };
    const { sourcesDb, goalsDb, removedSourceIds, removedGoalIds } = get();
    set(applyCatalog([...sourcesDb, source], goalsDb, removedSourceIds, removedGoalIds));
  },

  updateCustomSource: async (id, data) => {
    const { currentProfileId, sourcesDb, goalsDb, removedSourceIds, removedGoalIds } = get();
    if (!currentProfileId) return;

    const existing = sourcesDb.find(s => s.id === id);
    const def = DEFAULT_SOURCES.find(s => s.id === id);
    const label = data.label?.trim() ?? existing?.label ?? def?.label;
    const icon = data.icon ?? existing?.icon ?? def?.icon ?? 'Wallet';
    if (!label) return;

    if (existing) {
      const { error } = await supabase.from('sources').update({ label, icon }).eq('id', id);
      if (error) { console.error('updateCustomSource:', error); return; }
      const nextDb = sourcesDb.map(s => s.id === id ? { ...s, label, icon } : s);
      set(applyCatalog(nextDb, goalsDb, removedSourceIds, removedGoalIds));
    } else {
      const { error } = await supabase.from('sources').insert({
        id,
        profile_id: currentProfileId,
        label,
        icon,
        is_builtin: isDefaultSourceId(id),
      });
      if (error) { console.error('updateCustomSource insert:', error); return; }
      const nextDb = [...sourcesDb, { id, label, icon, createdAt: new Date().toISOString() }];
      const nextRemoved = removedSourceIds.filter(rid => rid !== id);
      storage.setRemovedSourceIds(currentProfileId, nextRemoved);
      set(applyCatalog(nextDb, goalsDb, nextRemoved, removedGoalIds));
    }
  },

  removeCustomSource: async (id) => {
    const { currentProfileId, transactions, customSources, sourcesDb, goalsDb, removedSourceIds, removedGoalIds } = get();
    if (!currentProfileId) return { reassigned: 0 };

    const remaining = customSources.filter(s => s.id !== id);
    if (remaining.length === 0) {
      throw new Error('Cần giữ ít nhất một nguồn tiền');
    }

    const fallbackId = pickFallbackSourceId(customSources, id);
    const reassigned = countTransactionsBySource(transactions, id);

    if (reassigned > 0) {
      const { error } = await supabase
        .from('transactions')
        .update({ source: fallbackId })
        .eq('profile_id', currentProfileId)
        .eq('source', id);
      if (error) { console.error('removeCustomSource reassign:', error); throw new Error('Không thể chuyển giao dịch sang nguồn khác'); }
    }

    const inDb = sourcesDb.some(s => s.id === id);
    if (inDb) {
      const { error } = await supabase.from('sources').delete().eq('id', id);
      if (error) { console.error('removeCustomSource:', error); throw new Error('Không thể xóa nguồn tiền'); }
    }

    const nextDb = sourcesDb.filter(s => s.id !== id);
    const nextRemoved = isDefaultSourceId(id)
      ? [...new Set([...removedSourceIds, id])]
      : removedSourceIds;
    const nextTx = transactions.map(t =>
      t.source === id ? { ...t, source: fallbackId } : t,
    );
    storage.setRemovedSourceIds(currentProfileId, nextRemoved);
    set({ transactions: nextTx, ...applyCatalog(nextDb, goalsDb, nextRemoved, removedGoalIds) });
    return { reassigned };
  },

  // ── Custom Budgets ──────────────────────────────────────
  addCustomBudget: async (label, icon) => {
    const { currentProfileId, customBudgets } = get();
    if (!currentProfileId) throw new Error('Chưa có profile (currentProfileId=null)');

    const id = uuidv4();
    const { data, error } = await supabase.from('goals').insert({
      id,
      profile_id: currentProfileId,
      label: label.trim(),
      icon,
      is_builtin: false,
      sort_order: customBudgets.length,
    }).select();

    if (error) { console.error('addCustomBudget:', error); throw error; }

    const budget: CustomBudget = { id, label: label.trim(), icon, createdAt: new Date().toISOString() };
    const { sourcesDb, goalsDb, removedSourceIds, removedGoalIds } = get();
    set(applyCatalog(sourcesDb, [...goalsDb, budget], removedSourceIds, removedGoalIds));
  },

  updateCustomBudget: async (id, data) => {
    const { currentProfileId, sourcesDb, goalsDb, removedSourceIds, removedGoalIds } = get();
    if (!currentProfileId) return;

    const existing = goalsDb.find(g => g.id === id);
    const def = DEFAULT_GOALS.find(g => g.id === id);
    const label = data.label?.trim() ?? existing?.label ?? def?.label;
    const icon = data.icon ?? existing?.icon ?? def?.icon ?? 'ShoppingCart';
    if (!label) return;

    if (existing) {
      const { error } = await supabase.from('goals').update({ label, icon }).eq('id', id);
      if (error) { console.error('updateCustomBudget:', error); return; }
      const nextDb = goalsDb.map(g => g.id === id ? { ...g, label, icon } : g);
      set(applyCatalog(sourcesDb, nextDb, removedSourceIds, removedGoalIds));
    } else {
      const { error } = await supabase.from('goals').insert({
        id,
        profile_id: currentProfileId,
        label,
        icon,
        is_builtin: isDefaultGoalId(id),
        sort_order: goalsDb.length,
      });
      if (error) { console.error('updateCustomBudget insert:', error); return; }
      const nextDb = [...goalsDb, { id, label, icon, createdAt: new Date().toISOString() }];
      const nextRemoved = removedGoalIds.filter(rid => rid !== id);
      storage.setRemovedGoalIds(currentProfileId, nextRemoved);
      set(applyCatalog(sourcesDb, nextDb, removedSourceIds, nextRemoved));
    }
  },

  removeCustomBudget: async (id) => {
    const { currentProfileId, transactions, customBudgets, sourcesDb, goalsDb, removedSourceIds, removedGoalIds } = get();
    if (!currentProfileId) return { reassigned: 0 };

    if (isProtectedGoalId(id)) {
      throw new Error('Không thể xóa mục chưa phân loại');
    }

    const remaining = customBudgets.filter(g => g.id !== id);
    if (!remaining.some(g => g.id === PROTECTED_GOAL_ID)) {
      throw new Error('Thiếu mục chưa phân loại — vui lòng tải lại trang');
    }

    const reassigned = countTransactionsByGoal(transactions, id);

    if (reassigned > 0) {
      const { error } = await supabase
        .from('transactions')
        .update({ goal: PROTECTED_GOAL_ID })
        .eq('profile_id', currentProfileId)
        .eq('goal', id);
      if (error) { console.error('removeCustomBudget reassign:', error); throw new Error('Không thể chuyển giao dịch sang chưa phân loại'); }
    }

    const inDb = goalsDb.some(g => g.id === id);
    if (inDb) {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) { console.error('removeCustomBudget:', error); throw new Error('Không thể xóa mục tiêu'); }
    }

    const nextDb = goalsDb.filter(g => g.id !== id);
    const nextRemoved = isDefaultGoalId(id)
      ? sanitizeRemovedGoalIds([...new Set([...removedGoalIds, id])])
      : removedGoalIds;
    const nextTx = transactions.map(t =>
      t.goal === id ? { ...t, goal: PROTECTED_GOAL_ID } : t,
    );
    storage.setRemovedGoalIds(currentProfileId, nextRemoved);
    set({ transactions: nextTx, ...applyCatalog(sourcesDb, nextDb, removedSourceIds, nextRemoved) });
    return { reassigned };
  },
}));
