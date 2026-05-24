/** Mục mặc định khi tạo profile — người dùng có thể sửa/xoá tùy ý */
export const DEFAULT_SOURCES = [
  { id: 'bank', label: 'Ngân hàng', icon: 'Building2' },
  { id: 'cash', label: 'Tiền mặt', icon: 'Wallet' },
  { id: 'momo', label: 'MoMo', icon: 'Smartphone' },
] as const;

export const DEFAULT_GOALS = [
  { id: 'none', label: 'Chưa phân loại', icon: 'Tag' },
  { id: 'saving', label: 'Tiết kiệm', icon: 'PiggyBank' },
  { id: 'travel', label: 'Du lịch', icon: 'Plane' },
  { id: 'soon', label: 'Sắp dùng', icon: 'Clock' },
] as const;

export const DEFAULT_SOURCE_IDS = DEFAULT_SOURCES.map(s => s.id);
export const DEFAULT_GOAL_IDS = DEFAULT_GOALS.map(g => g.id);
