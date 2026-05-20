import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Database row types (snake_case từ Supabase) ───────────

export interface ProfileRow {
  id: string;
  name: string;
  avatar_color: string;
  initial: string;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  profile_id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  source: string;
  goal: string;
  note: string;
  date: string;
  created_at: string;
}

export interface DebtRow {
  id: string;
  profile_id: string;
  type: 'owe' | 'lend';
  person: string;
  amount: number;
  note: string;
  due_date: string | null;
  settled: boolean;
  settled_at: string | null;
  created_at: string;
}

export interface CustomSourceRow {
  id: string;
  profile_id: string;
  label: string;
  icon: string;
  created_at: string;
}

export interface CustomBudgetRow {
  id: string;
  profile_id: string;
  label: string;
  icon: string;
  created_at: string;
}

// ─── Mapper helpers: DB row → App type ────────────────────

import { UserProfile, Transaction, Debt, CustomSource, CustomBudget } from './types';

export function toProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    avatarColor: row.avatar_color,
    initial: row.initial,
    createdAt: row.created_at,
  };
}

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    amount: row.amount,
    source: row.source,
    goal: row.goal,
    note: row.note,
    date: row.date,
    createdAt: row.created_at,
  };
}

export function toDebt(row: DebtRow): Debt {
  return {
    id: row.id,
    type: row.type,
    person: row.person,
    amount: row.amount,
    note: row.note,
    dueDate: row.due_date,
    settled: row.settled,
    settledAt: row.settled_at,
    createdAt: row.created_at,
  };
}

export function toCustomSource(row: CustomSourceRow): CustomSource {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon,
    createdAt: row.created_at,
  };
}

export function toCustomBudget(row: CustomBudgetRow): CustomBudget {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon,
    createdAt: row.created_at,
  };
}
