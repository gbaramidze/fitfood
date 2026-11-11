'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Elements marked with this attribute (horizontal scrollers, inner swipe areas) never start a page swipe. */
export const NO_SWIPE_ATTR = 'data-no-swipe';

interface TouchStart {
  x: number;
  y: number;
  t: number;
  lock: 'h' | 'v' | null;
}

const LOCK_DISTANCE = 10;

/**
 * Finger-following swipe between pages (the main tab pager).
 * Needs `touch-action: pan-y` on the swiped element so the browser keeps vertical scrolling
 * and hands horizontal movement to us.
 */
export function useSwipePager(opts: { index: number; count: number; onChange: (index: number) => void }) {
  const { index, count, onChange } = opts;
  const start = useRef<TouchStart | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest?.(`[${NO_SWIPE_ATTR}]`) || e.touches.length !== 1) {
      start.current = null;
      return;
    }
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), lock: null };
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const s = start.current;
      if (!s) return;
      const dx = e.touches[0].clientX - s.x;
      const dy = e.touches[0].clientY - s.y;
      if (!s.lock) {
        if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return;
        s.lock = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'h' : 'v';
        if (s.lock === 'h') setDragging(true);
      }
      if (s.lock !== 'h') return;
      // Rubber-band at the first / last page.
      const atEdge = (index === 0 && dx > 0) || (index === count - 1 && dx < 0);
      setDragX(atEdge ? dx * 0.25 : dx);
    },
    [index, count]
  );

  const finish = useCallback(
    (e: React.TouchEvent | null, cancelled: boolean) => {
      const s = start.current;
      start.current = null;
      if (!s || s.lock !== 'h') {
        setDragging(false);
        setDragX(0);
        return;
      }
      const endX = e?.changedTouches?.[0]?.clientX ?? s.x;
      const dx = endX - s.x;
      const velocity = Math.abs(dx) / Math.max(1, Date.now() - s.t);
      const width = (e?.currentTarget as HTMLElement | undefined)?.clientWidth || window.innerWidth;
      if (!cancelled && (Math.abs(dx) > width * 0.18 || velocity > 0.5) && Math.abs(dx) > 30) {
        const next = dx < 0 ? index + 1 : index - 1;
        if (next >= 0 && next < count) onChange(next);
      }
      setDragging(false);
      setDragX(0);
    },
    [index, count, onChange]
  );

  return {
    dragX,
    dragging,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd: (e: React.TouchEvent) => finish(e, false),
      onTouchCancel: (e: React.TouchEvent) => finish(e, true),
    },
  };
}

/** Simple threshold swipe (no finger-following) for inner areas, e.g. switching halls. */
export function useSwipeGesture(onSwipe: (dir: 'left' | 'right') => void) {
  const start = useRef<TouchStart | null>(null);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), lock: null };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.changedTouches[0].clientX - s.x;
      const dy = e.changedTouches[0].clientY - s.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 'left' : 'right');
    },
  };
}

/** ← / → switch tabs on devices with a keyboard (handy when testing on a desktop). */
export function useArrowKeys(onLeft: () => void, onRight: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') onLeft();
      if (e.key === 'ArrowRight') onRight();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onLeft, onRight]);
}
