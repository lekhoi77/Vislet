import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, Transaction, Debt, CustomSource, CustomBudget } from '@/lib/types';
import { AVATAR_COLORS } from '@/lib/constants';
import {
  supabase,
  toProfile,
  toTransaction,
  toDebt,
  toCustomSource,
  toCustomBudget,
} from '@/lib/supabase';

// localStorage chỉ lưu currentProfileId (client-side preference)
const CURRENT_KEY = 'viapp_current';
function getStoredProfileId(): string | null {
  try { return localStorage.getItem(CURRENT_KEY); } catch { return null; }
}
function setStoredProfileId(id: string): void {
  try { localStorage.setItem(CURRENT_KEY, id); } catch { /* noop */ }
}

interface AppState {
  profiles: UserProfile[];
  currentProfileId: string | null;
  transactions: Transaction[];
  debts: Debt[];
  customSources: CustomSource[];
  customBudgets: CustomBudget[];
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

  addCustomSource: (label: string) => Promise<void>;
  removeCustomSource: (id: string) => Promise<void>;

  addCustomBudget: (label: string, icon: string) => Promise<void>;
  removeCustomBudget: (id: string) => Promise<void>;
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
      .from('custom_sources')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true }),
    supabase
      .from('custom_budgets')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true }),
  ]);

  return {
    transactions: (txRes.data ?? []).map(toTransaction),
    debts: (debtRes.data ?? []).map(toDebt),
    customSources: (srcRes.data ?? []).map(toCustomSource),
    customBudgets: (bdgRes.data ?? []).map(toCustomBudget),
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
  isLoaded: false,
  isLoading: false,

  // ── Init ────────────────────────────────────────────────
  initApp: async () => {
    set({ isLoading: true });

    const { data: rows, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !rows || rows.length === 0) {
      set({ profiles: [], currentProfileId: null, isLoaded: true, isLoading: false });
      return;
    }

    const profiles = rows.map(toProfile);
    const storedId = getStoredProfileId();
    const activeId = (storedId && profiles.find(p => p.id === storedId))
      ? storedId
      : profiles[0].id;

    const profileData = await fetchProfileData(activeId);
    set({ profiles, currentProfileId: activeId, ...profileData, isLoaded: true, isLoading: false });
  },

  // ── Profiles ────────────────────────────────────────────
  createProfile: async (name: string) => {
    const { profiles } = get();
    const colorIndex = profiles.length % AVATAR_COLORS.length;
    const id = uuidv4();

    const { error } = await supabase.from('profiles').insert({
      id,
      name: name.trim(),
      avatar_color: AVATAR_COLORS[colorIndex],
      initial: name.trim().charAt(0).toUpperCase(),
    });

    if (error) { console.error('createProfile:', error); return; }

    const newProfile: UserProfile = {
      id,
      name: name.trim(),
      avatarColor: AVATAR_COLORS[colorIndex],
      initial: name.trim().charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    setStoredProfileId(id);
    set({
      profiles: [...profiles, newProfile],
      currentProfileId: id,
      transactions: [],
      debts: [],
      customSources: [],
      customBudgets: [],
    });
  },

  switchProfile: async (id: string) => {
    set({ isLoading: true });
    const profileData = await fetchProfileData(id);
    setStoredProfileId(id);
    set({ currentProfileId: id, ...profileData, isLoading: false });
  },

  deleteProfile: async (id: string) => {
    const { profiles, currentProfileId } = get();
    if (profiles.length <= 1) return;

    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { console.error('deleteProfile:', error); return; }

    const newProfiles = profiles.filter(p => p.id !== id);

    if (currentProfileId === id) {
      const nextId = newProfiles[0].id;
      const profileData = await fetchProfileData(nextId);
      setStoredProfileId(nextId);
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
    });

    if (error) { console.error('addTransaction:', error); return; }

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
  addCustomSource: async (label) => {
    const { currentProfileId, customSources } = get();
    if (!currentProfileId) return;

    const id = uuidv4();
    const { error } = await supabase.from('custom_sources').insert({
      id,
      profile_id: currentProfileId,
      label: label.trim(),
    });

    if (error) { console.error('addCustomSource:', error); return; }

    const source: CustomSource = { id, label: label.trim(), createdAt: new Date().toISOString() };
    set({ customSources: [...customSources, source] });
  },

  removeCustomSource: async (id) => {
    const { currentProfileId, customSources } = get();
    if (!currentProfileId) return;

    const { error } = await supabase.from('custom_sources').delete().eq('id', id);
    if (error) { console.error('removeCustomSource:', error); return; }

    set({ customSources: customSources.filter(s => s.id !== id) });
  },

  // ── Custom Budgets ──────────────────────────────────────
  addCustomBudget: async (label, icon) => {
    const { currentProfileId, customBudgets } = get();
    if (!currentProfileId) return;

    const id = uuidv4();
    const { error } = await supabase.from('custom_budgets').insert({
      id,
      profile_id: currentProfileId,
      label: label.trim(),
      icon,
    });

    if (error) { console.error('addCustomBudget:', error); return; }

    const budget: CustomBudget = { id, label: label.trim(), icon, createdAt: new Date().toISOString() };
    set({ customBudgets: [...customBudgets, budget] });
  },

  removeCustomBudget: async (id) => {
    const { currentProfileId, customBudgets } = get();
    if (!currentProfileId) return;

    const { error } = await supabase.from('custom_budgets').delete().eq('id', id);
    if (error) { console.error('removeCustomBudget:', error); return; }

    set({ customBudgets: customBudgets.filter(b => b.id !== id) });
  },
}));
