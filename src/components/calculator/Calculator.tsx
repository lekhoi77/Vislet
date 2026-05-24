'use client';

import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Delete, Calculator as CalcIcon, Info } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface CalcState {
  /** Raw number string used for computation, e.g. "1500000.5" */
  display: string;
  /** Human-readable expression shown above the display */
  expression: string;
  /** Pending operator: '+' | '-' | '×' | '÷' | null */
  operator: string | null;
  /** Left-hand operand */
  prevValue: number | null;
  /** True right after pressing an operator (next digit starts fresh) */
  waitingForOperand: boolean;
  /** True right after pressing = (resets on new digit/operator) */
  justCalculated: boolean;
}

export interface SaveSlot {
  id: string;
  value: number;
}

type CalcAction =
  | { type: 'DIGIT'; d: string }
  | { type: 'DECIMAL' }
  | { type: 'OP'; op: string }
  | { type: 'EQUALS' }
  | { type: 'AC' }
  | { type: 'SIGN' }
  | { type: 'PCT' }
  | { type: 'BS' }
  | { type: 'SET'; v: number };

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeNum(n: number): string {
  if (!isFinite(n) || isNaN(n)) return 'Lỗi';
  return parseFloat(n.toPrecision(12)).toString();
}

function compute(a: number, op: string, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b !== 0 ? a / b : NaN;
    default: return b;
  }
}

/** Format a raw number string for the expression line */
function exprFmt(raw: string): string {
  if (raw === 'Lỗi') return raw;
  const n = parseFloat(raw);
  return isNaN(n) ? raw : new Intl.NumberFormat('vi-VN').format(n);
}

/** Format raw display string → human-readable (vi-VN, decimal with comma) */
function formatDisplay(raw: string): string {
  if (raw === 'Lỗi') return 'Lỗi';
  const neg = raw.startsWith('-');
  const abs = neg ? raw.slice(1) : raw;
  const [intStr = '0', decStr] = abs.split('.');
  const intNum = parseInt(intStr, 10) || 0;
  const intFmt = new Intl.NumberFormat('vi-VN').format(intNum);
  return `${neg ? '-' : ''}${intFmt}${decStr !== undefined ? ',' + decStr : ''}`;
}

/** Compact label for save-slot chips */
function formatSlotShort(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}t`;
  if (abs >= 1_000_000)     return `${sign}${(abs / 1_000_000).toFixed(1)}tr`;
  if (abs >= 1_000)         return `${sign}${(abs / 1_000).toFixed(0)}k`;
  return `${sign}${abs}`;
}

function formatFull(v: number): string {
  return new Intl.NumberFormat('vi-VN').format(v) + ' ₫';
}

// ─────────────────────────────────────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────────────────────────────────────

const INIT: CalcState = {
  display: '0',
  expression: '',
  operator: null,
  prevValue: null,
  waitingForOperand: false,
  justCalculated: false,
};

function reducer(s: CalcState, a: CalcAction): CalcState {
  // Any action (except AC) on error state clears to 0
  if (s.display === 'Lỗi' && a.type !== 'AC') {
    if (a.type === 'DIGIT') return { ...INIT, display: a.d === '0' ? '0' : a.d };
    return { ...INIT };
  }

  switch (a.type) {
    /* ── Digit ─────────────────────────────────────────────── */
    case 'DIGIT': {
      if (s.waitingForOperand || s.justCalculated) {
        return { ...s, display: a.d === '0' ? '0' : a.d, waitingForOperand: false, justCalculated: false };
      }
      if (s.display === '0') return { ...s, display: a.d };
      // Max 12 significant digits
      const digits = s.display.replace(/[^0-9]/g, '');
      if (digits.length >= 12) return s;
      return { ...s, display: s.display + a.d };
    }

    /* ── Decimal ───────────────────────────────────────────── */
    case 'DECIMAL': {
      if (s.waitingForOperand || s.justCalculated) {
        return { ...s, display: '0.', waitingForOperand: false, justCalculated: false };
      }
      if (s.display.includes('.')) return s;
      return { ...s, display: s.display + '.' };
    }

    /* ── Operator ──────────────────────────────────────────── */
    case 'OP': {
      const cur = parseFloat(s.display);
      const { op } = a;

      // Chain: compute pending operation first
      if (s.operator && !s.waitingForOperand && !s.justCalculated) {
        const r = compute(s.prevValue!, s.operator, cur);
        const rs = sanitizeNum(r);
        if (rs === 'Lỗi') return { ...INIT, display: 'Lỗi', expression: 'Không thể chia cho 0' };
        return {
          ...s,
          display: rs,
          expression: `${exprFmt(rs)} ${op}`,
          operator: op,
          prevValue: r,
          waitingForOperand: true,
          justCalculated: false,
        };
      }

      const base = s.justCalculated ? s.display : sanitizeNum(cur);
      return {
        ...s,
        expression: `${exprFmt(base)} ${op}`,
        operator: op,
        prevValue: cur,
        waitingForOperand: true,
        justCalculated: false,
      };
    }

    /* ── Equals ────────────────────────────────────────────── */
    case 'EQUALS': {
      if (!s.operator || s.prevValue === null) {
        return { ...s, expression: '', justCalculated: true };
      }
      const cur = parseFloat(s.display);
      const r = compute(s.prevValue, s.operator, cur);
      const rs = sanitizeNum(r);
      if (rs === 'Lỗi') return { ...INIT, display: 'Lỗi', expression: 'Không thể chia cho 0' };
      return {
        display: rs,
        expression: `${s.expression} ${exprFmt(s.display)} =`,
        operator: null,
        prevValue: null,
        waitingForOperand: false,
        justCalculated: true,
      };
    }

    /* ── All Clear ─────────────────────────────────────────── */
    case 'AC': return { ...INIT };

    /* ── Toggle Sign ───────────────────────────────────────── */
    case 'SIGN': {
      const n = parseFloat(s.display);
      if (n === 0) return s;
      return { ...s, display: sanitizeNum(-n), justCalculated: false };
    }

    /* ── Percent ───────────────────────────────────────────── */
    case 'PCT': {
      const n = parseFloat(s.display);
      // If chained (e.g. 200 + 10% → 200 + 20), base is prevValue
      const r = s.prevValue !== null ? (s.prevValue * n) / 100 : n / 100;
      return { ...s, display: sanitizeNum(r), waitingForOperand: false };
    }

    /* ── Backspace ─────────────────────────────────────────── */
    case 'BS': {
      if (s.waitingForOperand || s.justCalculated) return s;
      if (s.display.length <= 1 || (s.display.startsWith('-') && s.display.length <= 2)) {
        return { ...s, display: '0' };
      }
      return { ...s, display: s.display.slice(0, -1) };
    }

    /* ── Set external value (from slot recall) ─────────────── */
    case 'SET': {
      // Giữ nguyên toán tử đang pending (operator, prevValue, expression)
      // chỉ thay display và đánh dấu "operand đã sẵn sàng"
      // → user có thể: bấm op trước rồi recall slot, hoặc recall slot rồi bấm op
      return {
        ...s,
        display: sanitizeNum(a.v),
        // KHÔNG xóa expression / operator / prevValue
        waitingForOperand: false,
        justCalculated: false,
      };
    }

    default: return s;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVE SLOTS — localStorage
// ─────────────────────────────────────────────────────────────────────────────

const SLOTS_KEY = 'viapp_calc_slots';
const MAX_SLOTS = 6;

function loadSlots(): SaveSlot[] {
  try { return JSON.parse(localStorage.getItem(SLOTS_KEY) ?? '[]') as SaveSlot[]; }
  catch { return []; }
}

function persistSlots(slots: SaveSlot[]): void {
  try { localStorage.setItem(SLOTS_KEY, JSON.stringify(slots)); } catch { /* noop */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

type BtnKind = 'num' | 'op' | 'eq' | 'fn' | 'bs';

interface BtnDef {
  label: React.ReactNode;
  key: string;
  kind: BtnKind;
  /** The operator string for highlighting active operator */
  opChar?: string;
  action: (dispatch: React.Dispatch<CalcAction>) => void;
}

const BUTTON_DEFS: BtnDef[] = [
  // Row 1
  { label: 'AC',  key: 'AC',  kind: 'fn', action: d => d({ type: 'AC' }) },
  { label: '+/-', key: 'SGN', kind: 'fn', action: d => d({ type: 'SIGN' }) },
  { label: '%',   key: 'PCT', kind: 'fn', action: d => d({ type: 'PCT' }) },
  { label: '÷',   key: 'DIV', kind: 'op', opChar: '÷', action: d => d({ type: 'OP', op: '÷' }) },
  // Row 2
  { label: '7', key: '7', kind: 'num', action: d => d({ type: 'DIGIT', d: '7' }) },
  { label: '8', key: '8', kind: 'num', action: d => d({ type: 'DIGIT', d: '8' }) },
  { label: '9', key: '9', kind: 'num', action: d => d({ type: 'DIGIT', d: '9' }) },
  { label: '×', key: 'MUL', kind: 'op', opChar: '×', action: d => d({ type: 'OP', op: '×' }) },
  // Row 3
  { label: '4', key: '4', kind: 'num', action: d => d({ type: 'DIGIT', d: '4' }) },
  { label: '5', key: '5', kind: 'num', action: d => d({ type: 'DIGIT', d: '5' }) },
  { label: '6', key: '6', kind: 'num', action: d => d({ type: 'DIGIT', d: '6' }) },
  { label: '−', key: 'SUB', kind: 'op', opChar: '-', action: d => d({ type: 'OP', op: '-' }) },
  // Row 4
  { label: '1', key: '1', kind: 'num', action: d => d({ type: 'DIGIT', d: '1' }) },
  { label: '2', key: '2', kind: 'num', action: d => d({ type: 'DIGIT', d: '2' }) },
  { label: '3', key: '3', kind: 'num', action: d => d({ type: 'DIGIT', d: '3' }) },
  { label: '+', key: 'ADD', kind: 'op', opChar: '+', action: d => d({ type: 'OP', op: '+' }) },
  // Row 5
  { label: <Delete size={17} />, key: 'BS',  kind: 'bs',  action: d => d({ type: 'BS' }) },
  { label: '0',                  key: '0',   kind: 'num', action: d => d({ type: 'DIGIT', d: '0' }) },
  { label: ',',                  key: 'DOT', kind: 'num', action: d => d({ type: 'DECIMAL' }) },
  { label: '=',                  key: 'EQ',  kind: 'eq',  action: d => d({ type: 'EQUALS' }) },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface CalculatorPanelProps {
  open: boolean;
  onClose: () => void;
}

// ─── Shortcut hints data (shown in the info tooltip) ─────────────────────────
const SHORTCUT_HINTS = [
  { scope: 'Toàn cục',    key: 'C',        desc: 'Mở máy tính' },
  { scope: 'Toàn cục',    key: 'T',        desc: 'Thu nhập' },
  { scope: 'Toàn cục',    key: 'E',        desc: 'Chi tiêu' },
  { scope: 'Toàn cục',    key: 'Esc',      desc: 'Đóng' },
  { scope: 'Máy tính',    key: 'S',        desc: 'Lưu slot' },
  { scope: 'Máy tính',    key: 'Enter / =',desc: 'Bằng (=)' },
  { scope: 'Máy tính',    key: '⌫',        desc: 'Xóa ký tự' },
];

export function CalculatorPanel({ open, onClose }: CalculatorPanelProps) {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [saveFlash, setSaveFlash] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const slotScrollRef = useRef<HTMLDivElement>(null);
  const hintsRef = useRef<HTMLDivElement>(null);
  // Portal mount guard — createPortal requires the DOM to be ready
  const [mounted, setMounted] = useState(false);

  // ── Load slots on mount ──────────────────────────────────
  useEffect(() => {
    setSlots(loadSlots());
    setMounted(true);
  }, []);

  // ── Close hints popup on outside click ───────────────────
  useEffect(() => {
    if (!showHints) return;
    const handler = (e: MouseEvent) => {
      if (!hintsRef.current?.contains(e.target as Node)) {
        setShowHints(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showHints]);

  // NOTE: Body scroll lock intentionally removed — calculator can be used
  // while the page (or underlying modals) remain scrollable.

  // ── Save current result to a slot ────────────────────────
  const handleSave = useCallback(() => {
    if (state.display === 'Lỗi') return;
    const value = parseFloat(state.display);
    if (isNaN(value)) return;

    const newSlot: SaveSlot = { id: Date.now().toString(), value };
    const next = [newSlot, ...slots].slice(0, MAX_SLOTS);
    setSlots(next);
    persistSlots(next);

    // Flash feedback
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 700);

    // Scroll to start so user sees the new slot
    setTimeout(() => {
      slotScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    }, 50);
  }, [state.display, slots]);

  // ── Delete a slot ─────────────────────────────────────────
  const handleDeleteSlot = useCallback((id: string) => {
    const next = slots.filter(s => s.id !== id);
    setSlots(next);
    persistSlots(next);
  }, [slots]);

  // ── Recall a slot value into calculator ──────────────────
  const handleRecallSlot = useCallback((v: number) => {
    dispatch({ type: 'SET', v });
  }, []);

  // ── Desktop keyboard handler ──────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const k = e.key;
      if (k >= '0' && k <= '9')                           { e.preventDefault(); dispatch({ type: 'DIGIT', d: k }); }
      else if (k === '.' || k === ',')                    { e.preventDefault(); dispatch({ type: 'DECIMAL' }); }
      else if (k === '+')                                  { e.preventDefault(); dispatch({ type: 'OP', op: '+' }); }
      else if (k === '-')                                  { e.preventDefault(); dispatch({ type: 'OP', op: '-' }); }
      else if (k === '*')                                  { e.preventDefault(); dispatch({ type: 'OP', op: '×' }); }
      else if (k === '/')                                  { e.preventDefault(); dispatch({ type: 'OP', op: '÷' }); }
      else if (k === 'Enter' || k === '=')                { e.preventDefault(); dispatch({ type: 'EQUALS' }); }
      else if (k === 'Backspace')                         { e.preventDefault(); dispatch({ type: 'BS' }); }
      else if (k === 'Escape')                            { e.preventDefault(); onClose(); }
      else if (k === '%')                                 { e.preventDefault(); dispatch({ type: 'PCT' }); }
      else if ((k === 's' || k === 'S') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleSave, onClose]);

  // ── Display formatting ───────────────────────────────────
  const displayText  = formatDisplay(state.display);
  const isError      = state.display === 'Lỗi';
  const displayLen   = displayText.length;
  const displaySize  = displayLen > 16 ? 20 : displayLen > 12 ? 26 : displayLen > 9 ? 30 : 36;

  if (!mounted) return null;

  return createPortal(
    <>
      {/* ── Backdrop (mobile only) ──────────────────────── */}
      <div
        className={`calc-backdrop ${open ? 'calc-backdrop-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ──────────────────────────────────────── */}
      <div
        className={`calc-panel ${open ? 'calc-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Máy tính"
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="calc-handle" />
        </div>

        {/* ── Panel header ─────────────────────────────── */}
        <div className="flex items-center justify-between px-4" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <div className="flex items-center gap-2">
            <CalcIcon size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
              Máy tính
            </span>

            {/* Info / shortcuts tooltip */}
            <div ref={hintsRef} style={{ position: 'relative', display: 'flex' }}>
              <button
                onClick={() => setShowHints(v => !v)}
                className="flex items-center justify-center rounded-full transition-colors hover:bg-[var(--muted)] active:scale-90"
                style={{
                  width: 20, height: 20,
                  color: showHints ? 'var(--primary)' : 'var(--muted-foreground)',
                  border: 'none', background: 'transparent', cursor: 'pointer',
                }}
                aria-label="Xem phím tắt"
                title="Phím tắt"
              >
                <Info size={13} />
              </button>

              {/* Hints popup */}
              {showHints && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 210,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-float)',
                    padding: '10px 12px',
                    zIndex: 10,
                  }}
                >
                  {/* Arrow */}
                  <div style={{
                    position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)',
                    width: 8, height: 8, background: 'var(--card)', border: '1px solid var(--border)',
                    borderBottom: 'none', borderRight: 'none', rotate: '45deg',
                  }} />

                  {/* Grouped shortcuts */}
                  {(['Toàn cục', 'Máy tính'] as const).map(scope => (
                    <div key={scope} style={{ marginBottom: scope === 'Toàn cục' ? 10 : 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 5 }}>
                        {scope}
                      </div>
                      {SHORTCUT_HINTS.filter(h => h.scope === scope).map(h => (
                        <div key={h.key} className="flex items-center justify-between" style={{ gap: 8, marginBottom: 4 }}>
                          <span
                            style={{
                              background: scope === 'Toàn cục' ? 'var(--primary-soft)' : 'var(--muted)',
                              color: scope === 'Toàn cục' ? 'var(--primary)' : 'var(--foreground)',
                              border: scope === 'Toàn cục' ? '1px solid var(--primary-muted)' : '1px solid var(--border)',
                              borderRadius: 5,
                              padding: '1px 7px',
                              fontSize: 11,
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {h.key}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', flex: 1, textAlign: 'right' }}>
                            {h.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--muted)] active:scale-90"
            style={{ width: 28, height: 28, color: 'var(--muted-foreground)', border: 'none', background: 'transparent', cursor: 'pointer' }}
            aria-label="Đóng máy tính"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Save Slots ───────────────────────────────── */}
        <div style={{ padding: '0 12px 10px' }}>
          {/* Section label */}
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 7 }}>
            Slot lưu
          </div>

          {/* Scrollable chip row — display: flex with overflow-x */}
          <div
            ref={slotScrollRef}
            className="calc-slots-row"
          >
            {/* Save button */}
            <button
              onClick={handleSave}
              className="calc-save-btn"
              style={{
                background: saveFlash ? 'var(--primary)' : 'var(--primary-soft)',
                color: saveFlash ? 'var(--primary-foreground)' : 'var(--primary)',
                borderColor: saveFlash ? 'var(--primary)' : 'var(--primary-muted)',
              }}
              aria-label="Lưu kết quả vào slot"
              title="Lưu kết quả hiện tại (phím S)"
            >
              <Plus size={11} />
              Lưu
            </button>

            {/* Empty hint */}
            {slots.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', whiteSpace: 'nowrap', lineHeight: '32px' }}>
                Chưa có slot
              </span>
            )}

            {/* Slot chips */}
            {slots.map(slot => (
              <div
                key={slot.id}
                className="calc-slot-chip"
                onClick={() => handleRecallSlot(slot.value)}
                title={`Dùng: ${formatFull(slot.value)}`}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleRecallSlot(slot.value)}
              >
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {formatSlotShort(slot.value)}
                </span>
                <button
                  className="calc-slot-del"
                  onClick={e => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                  aria-label={`Xóa slot ${formatSlotShort(slot.value)}`}
                >
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="calc-divider" />

        {/* ── Display ──────────────────────────────────── */}
        <div
          className="select-none"
          style={{ padding: '10px 16px 12px', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          {/* Expression line */}
          <div
            className="truncate"
            style={{
              fontSize: 12,
              color: 'var(--muted-foreground)',
              fontWeight: 400,
              minHeight: 17,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            {state.expression || ' '}
          </div>

          {/* Main value */}
          <div
            style={{
              fontSize: displaySize,
              fontWeight: 700,
              lineHeight: 1.15,
              color: isError ? 'var(--expense)' : 'var(--foreground)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.025em',
              wordBreak: 'break-all',
              transition: 'font-size 0.12s ease',
            }}
          >
            {displayText}
          </div>
        </div>

        {/* Divider */}
        <div className="calc-divider" style={{ marginBottom: 8 }} />

        {/* ── Keypad ───────────────────────────────────── */}
        {/*
          4×5 grid.
          Display is a <div> — no input element → mobile keyboard NEVER appears.
        */}
        <div className="calc-keypad">
          {BUTTON_DEFS.map(btn => {
            const isActiveOp = btn.kind === 'op' && state.operator === btn.opChar && !state.justCalculated;

            return (
              <button
                key={btn.key}
                className={`calc-btn calc-btn-${btn.kind}${isActiveOp ? ' calc-btn-op-active' : ''}`}
                onClick={() => btn.action(dispatch)}
                aria-label={typeof btn.label === 'string' ? btn.label : undefined}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Desktop keyboard hint — click ⓘ icon in title for full list */}
        <div
          className="hidden md:flex items-center justify-center gap-1.5"
          style={{ paddingBottom: 12, fontSize: 11, color: 'var(--muted-foreground)' }}
        >
          {['+', '−', '×', '/', 'Enter', 'Esc'].map(k => (
            <span
              key={k}
              style={{ background: 'var(--muted)', borderRadius: 4, padding: '1px 5px', fontWeight: 600, fontSize: 10, lineHeight: '16px' }}
            >
              {k}
            </span>
          ))}
          <span style={{ color: 'var(--border)', margin: '0 2px' }}>·</span>
          <span style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--primary-muted)', borderRadius: 4, padding: '1px 5px', fontWeight: 700, fontSize: 10, lineHeight: '16px' }}>
            S
          </span>
          <span>lưu</span>
        </div>
      </div>
    </>,
    document.body
  );
}
