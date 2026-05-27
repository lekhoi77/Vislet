'use client';

import { useState, useMemo } from 'react';
import { Transaction } from '@/lib/types';
import { resolveSourceLabel, resolveCategoryLabel } from '@/lib/constants';
import { useAppStore } from '@/store/app-store';
import { matchesQuery } from '@/lib/search';
import { TransactionList } from './TransactionList';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TxFilter {
  type: 'all' | 'income' | 'expense';
  sources: string[];
  categories: string[];
  amountMin: string;
  amountMax: string;
}

const DEFAULT_FILTER: TxFilter = {
  type: 'all',
  sources: [],
  categories: [],
  amountMin: '',
  amountMax: '',
};

function countActiveFilters(f: TxFilter): number {
  let n = 0;
  if (f.type !== 'all') n++;
  if (f.sources.length > 0) n++;
  if (f.categories.length > 0) n++;
  if (f.amountMin !== '') n++;
  if (f.amountMax !== '') n++;
  return n;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

// ── Chip multi-select ─────────────────────────────────────────
function ChipGroup({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const active = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(toggle(selected, o.value))}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: active ? 'var(--primary)' : 'var(--muted)',
              color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              border: active ? '1px solid var(--primary)' : '1px solid transparent',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Filter label helper ───────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted-foreground)' }}>
      {children}
    </p>
  );
}

// ── Main component ────────────────────────────────────────────
interface TransactionPaneProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
}

export function TransactionPane({ transactions, onEdit }: TransactionPaneProps) {
  const { customSources, customCategories } = useAppStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TxFilter>(DEFAULT_FILTER);
  const [draft, setDraft] = useState<TxFilter>(DEFAULT_FILTER); // in-sheet draft
  const [showFilter, setShowFilter] = useState(false);

  const activeCount = countActiveFilters(filter);

  // Build source + category options
  const sourceOptions = customSources.map(s => ({ value: s.id, label: s.label }));
  const categoryOptions = customCategories.map(c => ({ value: c.id, label: c.label }));

  // Apply filters
  const filtered = useMemo(() => {
    const min = filter.amountMin !== '' ? Number(filter.amountMin.replace(/\D/g, '')) : null;
    const max = filter.amountMax !== '' ? Number(filter.amountMax.replace(/\D/g, '')) : null;
    const hasSearch = search.trim() !== '';

    return transactions.filter(tx => {
      // Search trong cả title và note — không phân biệt dấu/hoa thường
      if (hasSearch) {
        if (!matchesQuery(tx.title, search) && !matchesQuery(tx.note ?? '', search)) return false;
      }
      if (filter.type !== 'all' && tx.type !== filter.type) return false;
      if (filter.sources.length > 0 && !filter.sources.includes(tx.source)) return false;
      if (filter.categories.length > 0 && !filter.categories.includes(tx.category)) return false;
      if (min !== null && tx.amount < min) return false;
      if (max !== null && tx.amount > max) return false;
      return true;
    });
  }, [transactions, search, filter]);

  const openFilter = () => {
    setDraft(filter); // sync draft to current applied filter
    setShowFilter(true);
  };

  const applyFilter = () => {
    setFilter(draft);
    setShowFilter(false);
  };

  const resetFilter = () => {
    setDraft(DEFAULT_FILTER);
  };

  const clearAll = () => {
    setFilter(DEFAULT_FILTER);
    setSearch('');
  };

  const hasAnyActive = activeCount > 0 || search.trim() !== '';

  return (
    <>
      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-5 mb-3">
        {/* Search */}
        <div className="relative flex-1 h-10">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc ghi chú..."
            className="h-10 text-sm rounded-xl"
            style={{ paddingLeft: 36, paddingRight: search ? 36 : 14 }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors"
              style={{ width: 20, height: 20, color: 'var(--muted-foreground)' }}
              aria-label="Xoá tìm kiếm"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          type="button"
          onClick={openFilter}
          className="relative flex items-center justify-center rounded-xl shrink-0 transition-colors hover:opacity-90 active:scale-95"
          style={{
            width: 40,
            height: 40,
            background: activeCount > 0 ? 'var(--primary)' : 'var(--muted)',
            color: activeCount > 0 ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
          }}
          aria-label="Bộ lọc"
        >
          <SlidersHorizontal size={16} />
          {activeCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[10px] font-bold"
              style={{ width: 16, height: 16, background: 'var(--orange)', color: '#fff' }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips summary */}
      {hasAnyActive && (
        <div className="flex items-center gap-2 px-5 mb-3 flex-wrap">
          {filter.type !== 'all' && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium"
              style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              {filter.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
              <button onClick={() => setFilter(f => ({ ...f, type: 'all' }))}><X size={11} /></button>
            </span>
          )}
          {filter.sources.map(s => (
            <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium"
              style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              {resolveSourceLabel(s, customSources)}
              <button onClick={() => setFilter(f => ({ ...f, sources: f.sources.filter(x => x !== s) }))}><X size={11} /></button>
            </span>
          ))}
          {filter.categories.map(c => (
            <span key={c} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium"
              style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              {resolveCategoryLabel(c, customCategories)}
              <button onClick={() => setFilter(f => ({ ...f, categories: f.categories.filter(x => x !== c) }))}><X size={11} /></button>
            </span>
          ))}
          {(filter.amountMin !== '' || filter.amountMax !== '') && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium"
              style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              Số tiền
              <button onClick={() => setFilter(f => ({ ...f, amountMin: '', amountMax: '' }))}><X size={11} /></button>
            </span>
          )}
          <button
            onClick={clearAll}
            className="text-sm font-medium"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Xoá tất cả
          </button>
        </div>
      )}

      {/* Result count */}
      {hasAnyActive && (
        <p className="px-5 mb-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {filtered.length} kết quả
        </p>
      )}

      {/* ── Transaction list ───────────────────────────────── */}
      <div
        className="mx-5 rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', minHeight: 80 }}
      >
        <TransactionList transactions={filtered} onEdit={onEdit} showLoadMore highlightQuery={search} />
      </div>

      {/* ── Filter Sheet ───────────────────────────────────── */}
      <Sheet open={showFilter} onOpenChange={v => !v && setShowFilter(false)}>
        <SheetContent
          side="bottom"
         
          className="rounded-t-2xl max-h-[88dvh] gap-0 flex flex-col p-0"
          style={{ background: 'var(--background)' }}
        >
          {/* Handle */}
          <div className="shrink-0 flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
          </div>

          {/* Header */}
          <SheetHeader className="shrink-0 px-5 pt-1 pb-4 gap-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle className="text-[15px] font-semibold text-left" style={{ color: 'var(--foreground)' }}>
              Bộ lọc
            </SheetTitle>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-5 px-5 py-5">
            {/* Type */}
            <div>
              <SectionLabel>Loại giao dịch</SectionLabel>
              <div className="flex gap-2">
                {(['all', 'income', 'expense'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, type: t }))}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: draft.type === t ? 'var(--primary)' : 'var(--muted)',
                      color: draft.type === t ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    }}
                  >
                    {t === 'all' ? 'Tất cả' : t === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sources */}
            <div>
              <SectionLabel>Nguồn tiền</SectionLabel>
              <ChipGroup
                options={sourceOptions}
                selected={draft.sources}
                onChange={v => setDraft(d => ({ ...d, sources: v }))}
              />
            </div>

            {/* Categories */}
            <div>
              <SectionLabel>Danh mục</SectionLabel>
              <ChipGroup
                options={categoryOptions}
                selected={draft.categories}
                onChange={v => setDraft(d => ({ ...d, categories: v }))}
              />
            </div>

            {/* Amount range */}
            <div>
              <SectionLabel>Khoảng số tiền (VNĐ)</SectionLabel>
              <div className="flex items-center gap-2.5">
                <Input
                  type="number"
                  placeholder="Từ"
                  value={draft.amountMin}
                  onChange={e => setDraft(d => ({ ...d, amountMin: e.target.value }))}
                  className="flex-1 h-10 text-sm rounded-xl"
                />
                <span className="text-sm shrink-0" style={{ color: 'var(--muted-foreground)' }}>—</span>
                <Input
                  type="number"
                  placeholder="Đến"
                  value={draft.amountMax}
                  onChange={e => setDraft(d => ({ ...d, amountMax: e.target.value }))}
                  className="flex-1 h-10 text-sm rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Footer: Reset + Apply */}
          <div className="shrink-0 flex gap-3 px-5 pt-3 pb-6" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={resetFilter}
              className="h-12 px-5 rounded-xl text-sm font-semibold transition-all hover:bg-[var(--muted)] active:scale-95"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              Đặt lại
            </button>
            <button
              type="button"
              onClick={applyFilter}
              className="flex-1 h-12 rounded-xl text-sm font-semibold tracking-wide transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              Áp dụng
              {countActiveFilters(draft) > 0 && ` (${countActiveFilters(draft)})`}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
