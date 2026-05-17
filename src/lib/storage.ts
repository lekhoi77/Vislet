import { UserProfile, Transaction, Debt } from './types';

const KEYS = {
  profiles: 'viapp_profiles',
  current: 'viapp_current',
  tx: (id: string) => `viapp_tx_${id}`,
  debt: (id: string) => `viapp_debt_${id}`,
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const storage = {
  getProfiles(): UserProfile[] {
    return safeGet<UserProfile[]>(KEYS.profiles, []);
  },
  setProfiles(profiles: UserProfile[]): boolean {
    return safeSet(KEYS.profiles, profiles);
  },

  getCurrentProfileId(): string | null {
    return safeGet<string | null>(KEYS.current, null);
  },
  setCurrentProfileId(id: string): boolean {
    return safeSet(KEYS.current, id);
  },

  getTransactions(profileId: string): Transaction[] {
    return safeGet<Transaction[]>(KEYS.tx(profileId), []);
  },
  setTransactions(profileId: string, txs: Transaction[]): boolean {
    return safeSet(KEYS.tx(profileId), txs);
  },

  getDebts(profileId: string): Debt[] {
    return safeGet<Debt[]>(KEYS.debt(profileId), []);
  },
  setDebts(profileId: string, debts: Debt[]): boolean {
    return safeSet(KEYS.debt(profileId), debts);
  },
};
