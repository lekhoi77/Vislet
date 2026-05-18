export interface UserProfile {
  id: string;
  name: string;
  avatarColor: string;
  initial: string;
  createdAt: string;
}

export type TransactionSource = string;
export type TransactionGoal = string;

export interface CustomSource {
  id: string;
  label: string;
  icon: string;
  createdAt: string;
}

export interface CustomBudget {
  id: string;
  label: string;
  icon: string;
  createdAt: string;
}
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
