'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Drag-to-expand bottom sheet với 2 snap points (half / full) và lưu trạng
 * thái vào localStorage.
 *
 * Cách dùng:
 * ```tsx
 * const { sheetStyle, handleProps } = useDraggableSheet('tx-form-snap', true);
 * <SheetContent style={sheetStyle}>
 *   <div {...handleProps}><div className="w-10 h-1 ..." /></div>
 *   ...
 * </SheetContent>
 * ```
 *
 * @param storageKey  Key trong localStorage để nhớ snap cuối cùng
 * @param defaultExpanded  Trạng thái ban đầu nếu chưa từng lưu (false=nửa, true=full)
 */
export function useDraggableSheet(storageKey: string, defaultExpanded = false) {
  const HALF_HEIGHT = '52dvh';
  const FULL_HEIGHT = '92dvh';

  const [expanded, setExpanded] = useState(defaultExpanded);

  // Restore one-shot từ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === '1') setExpanded(true);
      else if (saved === '0') setExpanded(false);
    } catch { /* ignore */ }
  }, [storageKey]);

  // Persist mọi lần thay đổi
  useEffect(() => {
    try { localStorage.setItem(storageKey, expanded ? '1' : '0'); } catch { /* ignore */ }
  }, [storageKey, expanded]);

  const dragRef = useRef<{ startY: number; startExpanded: boolean } | null>(null);

  const handleProps = {
    onPointerDown: (e: React.PointerEvent) => {
      dragRef.current = { startY: e.clientY, startExpanded: expanded };
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dy = e.clientY - dragRef.current.startY;
      if (dy < -40 && !dragRef.current.startExpanded) {
        setExpanded(true);
        dragRef.current.startExpanded = true;
        dragRef.current.startY = e.clientY;
      } else if (dy > 40 && dragRef.current.startExpanded) {
        setExpanded(false);
        dragRef.current.startExpanded = false;
        dragRef.current.startY = e.clientY;
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dy = e.clientY - dragRef.current.startY;
      // Click thuần (không kéo) → toggle
      if (Math.abs(dy) < 4) setExpanded(v => !v);
      dragRef.current = null;
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    },
    onPointerCancel: () => { dragRef.current = null; },
  };

  const sheetStyle: React.CSSProperties = {
    maxHeight: expanded ? FULL_HEIGHT : HALF_HEIGHT,
    height: expanded ? FULL_HEIGHT : HALF_HEIGHT,
    transition: 'max-height 300ms ease-out, height 300ms ease-out',
  };

  return { expanded, setExpanded, sheetStyle, handleProps };
}
