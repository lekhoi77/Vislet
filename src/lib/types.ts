export interface UserProfile {
  id: string;
  name: string;
  avatarColor: string;
  initial: string;
  createdAt: string;
}

export type TransactionSource = 'bank' | 'cash' | 'momo';
export type TransactionGoal = 'none' | 'saving' | 'travel' | 'soon';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  source: TransactionSource;
  goal: TransactionGoal;
  note: string;
  date: string;
  createdAt: string;
}

export type DebtType = 'owe' | 'lend';

export interface Debt {
  id: string;
  type: DebtType;
  person: string;
  amount: number;
  note: string;
  dueDate: string | null;
  settled: boolean;
  settledAt: string | null;
  createdAt: string;
}
