'use client';

import { formatVND } from '@/lib/format';
import { parseAmount } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  type?: 'income' | 'expense';
  error?: string;
  label?: string;
}

export function AmountInput({ value, onChange, type = 'income', error, label = 'Số tiền *' }: AmountInputProps) {
  const displayValue = value === 0 ? '' : new Intl.NumberFormat('vi-VN').format(value);
  const previewColor = type === 'income' ? 'var(--income)' : 'var(--expense)';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, '').replace(/,/g, '');
    const parsed = parseInt(raw.replace(/\D/g, '') || '0', 10);
    onChange(parsed);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </Label>
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder="0"
          className={cn(
            'pr-16 text-base font-semibold',
            error && 'border-[var(--destructive)]'
          )}
        />
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium"
          style={{ color: 'var(--muted-foreground)' }}
        >
          VNĐ
        </span>
      </div>
      {value > 0 && (
        <p className="text-sm font-medium amount" style={{ color: previewColor }}>
          {formatVND(value)}
        </p>
      )}
      {error && (
        <p className="text-sm" style={{ color: 'var(--destructive)' }}>{error}</p>
      )}
    </div>
  );
}
