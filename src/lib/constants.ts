import type { CustomSource, CustomCategory } from './types';

export const BUILT_IN_SOURCES = ['bank', 'cash', 'momo'] as const;
export const BUILT_IN_CATEGORIES = ['none', 'saving', 'travel', 'soon'] as const;

// ─── Label resolvers (hỗ trợ cả built-in và custom) ─────────

export function resolveSourceLabel(sourceId: string, customSources: CustomSource[] = []): string {
  return SOURCE_LABELS[sourceId]
    ?? customSources.find(s => s.id === sourceId)?.label
    ?? sourceId;
}

export function resolveCategoryLabel(categoryId: string, customCategories: CustomCategory[] = []): string {
  return CATEGORY_LABELS[categoryId]
    ?? customCategories.find(c => c.id === categoryId)?.label
    ?? categoryId;
}

export function isBuiltInCategory(categoryId: string): boolean {
  return (BUILT_IN_CATEGORIES as readonly string[]).includes(categoryId);
}

export function isBuiltInSource(sourceId: string): boolean {
  return (BUILT_IN_SOURCES as readonly string[]).includes(sourceId);
}

export const CATEGORY_ICONS = [
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

export const CATEGORY_LABELS: Record<string, string> = {
  none: 'Không phân loại',
  saving: 'Tiết kiệm',
  travel: 'Du lịch',
  soon: 'Sắp dùng',
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  saving: 'Không rút — chỉ tích lũy',
  travel: 'Dành cho chuyến đi',
  soon: 'Tiền chờ chi tiêu',
};

export const MAX_PROFILES = 5;
export const PAGE_SIZE = 20;

// ─── Category colors (dùng chung cho CategoryBlocks, ExpenseBreakdown, CategoryOverview) ─
export const CATEGORY_COLORS = [
  '#3b82f6', // blue     — saving
  '#f59e0b', // amber    — travel
  '#10b981', // emerald  — soon
  '#f43f5e', // rose     — none
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#14b8a6', // teal
];

/** Màu cố định cho built-in categories */
const BUILT_IN_CATEGORY_COLOR: Record<string, string> = {
  saving: CATEGORY_COLORS[0],
  travel: CATEGORY_COLORS[1],
  soon:   CATEGORY_COLORS[2],
  none:   CATEGORY_COLORS[3],
};

/** Trả về màu nhất quán cho một categoryId (built-in hoặc custom) */
export function getCategoryColor(categoryId: string, customCategories: CustomCategory[]): string {
  if (BUILT_IN_CATEGORY_COLOR[categoryId]) return BUILT_IN_CATEGORY_COLOR[categoryId];
  const idx = customCategories.findIndex(c => c.id === categoryId);
  // custom categories bắt đầu từ index 4 trở đi
  return CATEGORY_COLORS[(4 + Math.max(0, idx)) % CATEGORY_COLORS.length];
}
