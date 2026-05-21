import { Solar } from 'lunar-javascript';

export interface LunarDayMonth {
  day: number;
  month: number;
  isLeapMonth: boolean;
}

export function getLunarDayMonth(date: Date): LunarDayMonth {
  const lunar = Solar.fromYmd(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  ).getLunar();

  const monthRaw = lunar.getMonth();
  return {
    day: lunar.getDay(),
    month: Math.abs(monthRaw),
    isLeapMonth: monthRaw < 0,
  };
}

export function formatLunarDayMonth(date: Date): string {
  const { day, month, isLeapMonth } = getLunarDayMonth(date);
  const leap = isLeapMonth ? ' nhuận' : '';
  return `${day}/${month}${leap}`;
}
