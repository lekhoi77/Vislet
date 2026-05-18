export const BUILT_IN_SOURCES = ['bank', 'cash', 'momo'] as const;
export const BUILT_IN_GOALS = ['none', 'saving', 'travel', 'soon'] as const;

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
