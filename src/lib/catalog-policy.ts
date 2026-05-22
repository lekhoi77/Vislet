import type { Transaction, CustomSource } from './types';
import { DEFAULT_SOURCES } from './defaults';

/** Mục tiêu hệ thống — luôn hiển thị, không xóa được (có thể đổi tên) */
export const PROTECTED_GOAL_ID = 'none';

export function isProtectedGoalId(id: string): boolean {
  return id === PROTECTED_GOAL_ID;
}

export function sanitizeRemovedGoalIds(ids: string[]): string[] {
  return ids.filter(id => id !== PROTECTED_GOAL_ID);
}

export function countTransactionsByGoal(transactions: Transaction[], goalId: string): number {
  return transactions.filter(t => t.goal === goalId).length;
}

export function countTransactionsBySource(transactions: Transaction[], sourceId: string): number {
  return transactions.filter(t => t.source === sourceId).length;
}

export function pickFallbackSourceId(sources: CustomSource[], excludeId: string): string {
  const other = sources.find(s => s.id !== excludeId);
  return other?.id ?? DEFAULT_SOURCES[0].id;
}
