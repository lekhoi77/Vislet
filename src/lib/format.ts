import { formatLunarDayMonth } from '@/lib/lunar';

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

export function formatVNDShort(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(m) + ' tr';
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(k) + 'k';
  }
  return new Intl.NumberFormat('vi-VN').format(amount);
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatMonthYear(month: number, year: number): string {
  return `Tháng ${month}, ${year}`;
}

export function formatCurrentDateTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const lunar = formatLunarDayMonth(date);
  return `${hours}:${minutes}, ${day}/${month}/${year} · ${lunar} âm`;
}

export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/\D/g, '');
  return parseInt(cleaned || '0', 10);
}

export function formatAmountInput(value: number): string {
  if (value === 0) return '';
  return new Intl.NumberFormat('vi-VN').format(value);
}
