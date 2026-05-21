import type { CustomSource, CustomBudget } from './types';

export const BUILT_IN_SOURCES = ['bank', 'cash', 'momo'] as const;
export const BUILT_IN_GOALS = ['none', 'saving', 'travel', 'soon'] as const;

// ─── Label resolvers (hỗ trợ cả built-in và custom) ─────────

export function resolveSourceLabel(sourceId: string, customSources: CustomSource[] = []): string {
  return SOURCE_LABELS[sourceId]
    ?? customSources.find(s => s.id === sourceId)?.label
    ?? sourceId;
}

export function resolveGoalLabel(goalId: string, customBudgets: CustomBudget[] = []): string {
  return GOAL_LABELS[goalId]
    ?? customBudgets.find(b => b.id === goalId)?.label
    ?? goalId;
}

export function isBuiltInGoal(goalId: string): boolean {
  return (BUILT_IN_GOALS as readonly string[]).includes(goalId);
}

export function isBuiltInSource(sourceId: string): boolean {
  return (BUILT_IN_SOURCES as readonly string[]).includes(sourceId);
}

export const BUDGET_ICONS = [
  'PiggyBank','ShoppingCart','Coffee','Car','Home','Heart',
  'Briefcase','GraduationCap','Plane','Music','Dumbbell','Gift',
  'Smartphone','Shirt','Baby','Utensils','Zap','Star',
  'Gamepad2','BookOpen','Tv','Bus','Camera','Stethoscope',
  'Leaf','Package','CreditCard','Scissors','Pencil','Wrench',
] as const;

export const AVATAR_COLORS = [
  'hsl(145, 45%, 42%)',
  'hsl(210, 65%, 52%)',
  'hsl(35, 90%, 55%)',
  'hsl(280, 50%, 55%)',
  'hsl(350, 70%, 55%)',
];

export const SOURCE_LABELS: Record<string, string> = {
  bank: 'Ngân hàng',
  cash: 'Tiền mặt',
  momo: 'MoMo',
};

export const GOAL_LABELS: Record<string, string> = {
  none: 'Không phân loại',
  saving: 'Tiết kiệm',
  travel: 'Du lịch',
  soon: 'Sắp dùng',
};

export const GOAL_DESCRIPTIONS: Record<string, string> = {
  saving: 'Không rút — chỉ tích lũy',
  travel: 'Dành cho chuyến đi',
  soon: 'Tiền chờ chi tiêu',
};

export const MAX_PROFILES = 5;
export const PAGE_SIZE = 20;
