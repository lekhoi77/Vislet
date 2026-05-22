import type { CustomSource, CustomBudget } from './types';
import {
  DEFAULT_SOURCES,
  DEFAULT_GOALS,
  DEFAULT_SOURCE_IDS,
  DEFAULT_GOAL_IDS,
} from './defaults';
import { PROTECTED_GOAL_ID, sanitizeRemovedGoalIds } from './catalog-policy';

export function mergeSources(
  dbSources: CustomSource[],
  removedIds: string[] = [],
): CustomSource[] {
  const byId = new Map(dbSources.map(s => [s.id, s]));
  const removed = new Set(removedIds);
  const result: CustomSource[] = [];

  for (const def of DEFAULT_SOURCES) {
    if (removed.has(def.id)) continue;
    result.push(
      byId.get(def.id) ?? {
        id: def.id,
        label: def.label,
        icon: def.icon,
        createdAt: '',
      },
    );
    byId.delete(def.id);
  }

  for (const s of byId.values()) result.push(s);
  return result;
}

export function mergeGoals(
  dbGoals: CustomBudget[],
  removedIds: string[] = [],
): CustomBudget[] {
  const byId = new Map(dbGoals.map(g => [g.id, g]));
  const removed = new Set(sanitizeRemovedGoalIds(removedIds));
  const result: CustomBudget[] = [];

  for (const def of DEFAULT_GOALS) {
    if (def.id !== PROTECTED_GOAL_ID && removed.has(def.id)) continue;
    result.push(
      byId.get(def.id) ?? {
        id: def.id,
        label: def.label,
        icon: def.icon,
        createdAt: '',
      },
    );
    byId.delete(def.id);
  }

  for (const g of byId.values()) result.push(g);
  return result;
}

export function isDefaultSourceId(id: string): boolean {
  return DEFAULT_SOURCE_IDS.includes(id as (typeof DEFAULT_SOURCE_IDS)[number]);
}

export function isDefaultGoalId(id: string): boolean {
  return DEFAULT_GOAL_IDS.includes(id as (typeof DEFAULT_GOAL_IDS)[number]);
}

/** Đưa mục chưa phân loại lên đầu danh sách */
export function sortGoalsForDisplay<T extends { id: string }>(goals: T[]): T[] {
  return [...goals].sort((a, b) => {
    if (a.id === PROTECTED_GOAL_ID) return -1;
    if (b.id === PROTECTED_GOAL_ID) return 1;
    return 0;
  });
}
