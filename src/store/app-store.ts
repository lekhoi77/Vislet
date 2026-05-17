import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, Transaction, Debt } from '@/lib/types';
import { storage } from '@/lib/storage';
import { AVATAR_COLORS } from '@/lib/constants';

interface AppState {
  profiles: UserProfile[];
  currentProfileId: string | null;
  transactions: Transaction[];
  debts: Debt[];
  isLoaded: boolean;

  // Actions
  initApp: () => void;
  createProfile: (name: string) => void;
  switchProfile: (id: string) => void;
  deleteProfile: (id: string) => void;

  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'settled' | 'settledAt'>) => void;
  updateDebt: (id: string, data: Partial<Debt>) => void;
  settleDebt: (id: string) => void;
  deleteDebt: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  currentProfileId: null,
  transactions: [],
  debts: [],
  isLoaded: false,

  initApp: () => {
    const profiles = storage.getProfiles();
    const currentId = storage.getCurrentProfileId();

    if (profiles.length === 0) {
      // Fresh install — onboarding will handle it
      set({ profiles: [], currentProfileId: null, transactions: [], debts: [], isLoaded: true });
      return;
    }

    const active = currentId && profiles.find(p => p.id === currentId)
      ? currentId
      : profiles[0].id;

    const transactions = storage.getTransactions(active);
    const debts = storage.getDebts(active);

    set({ profiles, currentProfileId: active, transactions, debts, isLoaded: true });
  },

  createProfile: (name: string) => {
    const { profiles } = get();
    const id = uuidv4();
    const colorIndex = profiles.length % AVATAR_COLORS.length;
    const profile: UserProfile = {
      id,
      name: name.trim(),
      avatarColor: AVATAR_COLORS[colorIndex],
      initial: name.trim().charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    const newProfiles = [...profiles, profile];
    storage.setProfiles(newProfiles);
    storage.setCurrentProfileId(id);
    set({
      profiles: newProfiles,
      currentProfileId: id,
      transactions: [],
      debts: [],
    });
  },

  switchProfile: (id: string) => {
    storage.setCurrentProfileId(id);
    const transactions = storage.getTransactions(id);
    const debts = storage.getDebts(id);
    set({ currentProfileId: id, transactions, debts });
  },

  deleteProfile: (id: string) => {
    const { profiles, currentProfileId } = get();
    if (profiles.length <= 1) return; // can't delete last profile
    const newProfiles = profiles.filter(p => p.id !== id);
    storage.setProfiles(newProfiles);

    if (currentProfileId === id) {
      const nextId = newProfiles[0].id;
      storage.setCurrentProfileId(nextId);
      const transactions = storage.getTransactions(nextId);
      const debts = storage.getDebts(nextId);
      set({ profiles: newProfiles, currentProfileId: nextId, transactions, debts });
    } else {
      set({ profiles: newProfiles });
    }
  },

  addTransaction: (txData) => {
    const { currentProfileId, transactions } = get();
    if (!currentProfileId) return;
    const tx: Transaction = {
      ...txData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    const updated = [tx, ...transactions];
    storage.setTransactions(currentProfileId, updated);
    set({ transactions: updated });
  },

  updateTransaction: (id, data) => {
    const { currentProfileId, transactions } = get();
    if (!currentProfileId) return;
    const updated = transactions.map(t => t.id === id ? { ...t, ...data } : t);
    storage.setTransactions(currentProfileId, updated);
    set({ transactions: updated });
  },

  deleteTransaction: (id) => {
    const { currentProfileId, transactions } = get();
    if (!currentProfileId) return;
    const updated = transactions.filter(t => t.id !== id);
    storage.setTransactions(currentProfileId, updated);
    set({ transactions: updated });
  },

  addDebt: (debtData) => {
    const { currentProfileId, debts } = get();
    if (!currentProfileId) return;
    const debt: Debt = {
      ...debtData,
      id: uuidv4(),
      settled: false,
      settledAt: null,
      createdAt: new Date().toISOString(),
    };
    const updated = [debt, ...debts];
    storage.setDebts(currentProfileId, updated);
    set({ debts: updated });
  },

  updateDebt: (id, data) => {
    const { currentProfileId, debts } = get();
    if (!currentProfileId) return;
    const updated = debts.map(d => d.id === id ? { ...d, ...data } : d);
    storage.setDebts(currentProfileId, updated);
    set({ debts: updated });
  },

  settleDebt: (id) => {
    const { currentProfileId, debts } = get();
    if (!currentProfileId) return;
    const updated = debts.map(d =>
      d.id === id ? { ...d, settled: true, settledAt: new Date().toISOString() } : d
    );
    storage.setDebts(currentProfileId, updated);
    set({ debts: updated });
  },

  deleteDebt: (id) => {
    const { currentProfileId, debts } = get();
    if (!currentProfileId) return;
    const updated = debts.filter(d => d.id !== id);
    storage.setDebts(currentProfileId, updated);
    set({ debts: updated });
  },
}));
