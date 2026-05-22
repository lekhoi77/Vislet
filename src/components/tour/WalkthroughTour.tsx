'use client';

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TOUR_STEPS, TourStep } from './tour-steps';

interface Rect { top: number; left: number; width: number; height: number; }

interface WalkthroughTourProps {
  open: boolean;
  onClose: () => void;
  onRequestTab?: (tab: 'overview' | 'transactions' | 'goals' | 'debts') => void;
}

const PAD = 8;

export function WalkthroughTour({ open, onClose, onRequestTab }: WalkthroughTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);
  const lastTabRef = useRef<string | null>(null);
  const onRequestTabRef = useRef(onRequestTab);
  useEffect(() => { onRequestTabRef.current = onRequestTab; }, [onRequestTab]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) {
      setIndex(0);
      lastTabRef.current = null;
    }
  }, [open]);

  const step: TourStep | undefined = TOUR_STEPS[index];

  // When step.tab changes, switch tab once. Use ref to avoid re-triggering
  // on parent re-renders that produce a new onRequestTab identity.
  useEffect(() => {
    if (!open || !step) return;
    const tab = step.tab;
    if (!tab) return;
    if (lastTabRef.current === tab) return;
    lastTabRef.current = tab;
    onRequestTabRef.current?.(tab);
  }, [open, step]);

  // Measure target element. `scroll` arg only true on step change.
  const measure = useCallback((scroll: boolean) => {
    if (!step || !step.selector) { setRect(null); return; }
    const el = document.querySelector<HTMLElement>(step.selector);
    if (!el) { setRect(null); return; }
    if (scroll) el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    const next = {
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    };
    setRect(prev =>
      prev && prev.top === next.top && prev.left === next.left
        && prev.width === next.width && prev.height === next.height
        ? prev : next
    );
  }, [step]);

  // Run once per step: scroll to target, then measure twice for stability.
  useLayoutEffect(() => {
    if (!open) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      measure(true);
      raf2 = requestAnimationFrame(() => measure(false));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [open, index, measure]);

  // Re-measure (no scroll) on resize only. Skipping scroll listener avoids feedback
  // loop with scrollIntoView and surrounding scroll-driven re-renders.
  useEffect(() => {
    if (!open) return;
    const handle = () => measure(false);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setIndex(i => Math.min(i + 1, TOUR_STEPS.length - 1));
      else if (e.key === 'ArrowLeft') setIndex(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mounted || !step) return null;

  const isLast = index === TOUR_STEPS.length - 1;
  const isFirst = index === 0;

  // Tooltip placement
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const tooltipW = Math.min(340, vw - 32);
  const tooltipH = 220; // approximate

  let tipTop = vh / 2 - tooltipH / 2;
  let tipLeft = vw / 2 - tooltipW / 2;

  if (rect && step.placement !== 'center') {
    const spaceBelow = vh - (rect.top + rect.height);
    const spaceAbove = rect.top;
    const placeBelow = step.placement === 'bottom'
      || (step.placement !== 'top' && spaceBelow >= tooltipH + 16)
      || spaceBelow >= spaceAbove;

    if (placeBelow) {
      tipTop = Math.min(rect.top + rect.height + 12, vh - tooltipH - 12);
    } else {
      tipTop = Math.max(12, rect.top - tooltipH - 12);
    }
    tipLeft = rect.left + rect.width / 2 - tooltipW / 2;
    tipLeft = Math.max(12, Math.min(tipLeft, vw - tooltipW - 12));
  }

  const Icon = step.icon;

  // Build mask using SVG data URL for cutout effect
  const maskStyle: React.CSSProperties = {};
  if (rect) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${vw}' height='${vh}'><defs><mask id='m'><rect width='100%25' height='100%25' fill='white'/><rect x='${rect.left}' y='${rect.top}' width='${rect.width}' height='${rect.height}' rx='14' fill='black'/></mask></defs><rect width='100%25' height='100%25' fill='black' mask='url(%23m)'/></svg>`;
    const url = `url("data:image/svg+xml;utf8,${svg}")`;
    (maskStyle as React.CSSProperties & Record<string, string>)['WebkitMaskImage'] = url;
    (maskStyle as React.CSSProperties & Record<string, string>)['maskImage'] = url;
    (maskStyle as React.CSSProperties & Record<string, string>)['WebkitMaskRepeat'] = 'no-repeat';
    (maskStyle as React.CSSProperties & Record<string, string>)['maskRepeat'] = 'no-repeat';
  }

  return createPortal(
    <>
      <div
        className="tour-mask"
        style={maskStyle}
        onClick={onClose}
        aria-hidden
      />
      {rect && (
        <div
          className="tour-highlight"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          aria-hidden
        />
      )}

      <div
        className="tour-tooltip"
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        style={{ top: tipTop, left: tipLeft, width: tooltipW }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--primary-soft)', color: 'var(--primary)',
            }}
          >
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                {step.title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-md p-1 hover:bg-[var(--muted)] transition-colors"
                aria-label="Đóng hướng dẫn"
              >
                <X size={16} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>
            <p
              className="mt-1.5 text-sm leading-relaxed"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {step.body}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span
            className="text-xs font-medium shrink-0 whitespace-nowrap"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {index + 1} / {TOUR_STEPS.length}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onClose}
              className="text-sm font-medium px-2.5 py-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors whitespace-nowrap"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Bỏ qua
            </button>
            {!isFirst && (
              <button
                onClick={() => setIndex(i => Math.max(i - 1, 0))}
                className="flex items-center gap-1 text-sm font-medium px-2.5 py-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors whitespace-nowrap"
                style={{ color: 'var(--foreground)' }}
              >
                <ChevronLeft size={14} /> Trước
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) onClose();
                else setIndex(i => Math.min(i + 1, TOUR_STEPS.length - 1));
              }}
              className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {isLast ? 'Hoàn tất' : (<>Tiếp <ChevronRight size={14} /></>)}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
