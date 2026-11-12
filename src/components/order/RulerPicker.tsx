'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * A native-app style number picker: a ruler you swipe (like bathroom scales or a height tape).
 * `h` = horizontal ruler (weight, age); `v` = vertical ruler, bigger numbers on top (height).
 * Touch scrolling and snapping are the browser's own, so it feels native on phones; on a mouse you
 * can drag it, and +/- buttons and the arrow keys work everywhere.
 */
interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  orientation?: 'h' | 'v';
  /** pixels between two ticks */
  unitPx?: number;
  /** a long tick with a number every N units */
  majorEvery?: number;
  label: string;
}

export function RulerPicker({ value, min, max, onChange, orientation = 'h', unitPx = 12, majorEvery = 10, label }: Props) {
  const horizontal = orientation === 'h';
  const reverse = !horizontal; // vertical: max at the top
  const box = useRef<HTMLDivElement>(null);
  const scrolling = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<{ start: number; from: number } | null>(null);

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);
  const posOf = useCallback((v: number) => (reverse ? max - clamp(v) : clamp(v) - min) * unitPx, [reverse, max, min, unitPx, clamp]);
  const valueAt = useCallback(
    (pos: number) => {
      const i = Math.round(pos / unitPx);
      return clamp(reverse ? max - i : min + i);
    },
    [unitPx, reverse, max, min, clamp]
  );
  const read = () => (horizontal ? box.current!.scrollLeft : box.current!.scrollTop);
  const write = (pos: number, smooth = false) => {
    const el = box.current;
    if (!el) return;
    if (smooth) el.scrollTo(horizontal ? { left: pos, behavior: 'smooth' } : { top: pos, behavior: 'smooth' });
    else if (horizontal) el.scrollLeft = pos;
    else el.scrollTop = pos;
  };

  // first paint: put the current value under the marker
  useLayoutEffect(() => {
    write(posOf(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the value changed from outside (buttons, keyboard, saved data) — move the ruler, unless the finger is moving it
  useEffect(() => {
    if (scrolling.current || drag.current) return;
    if (Math.abs(read() - posOf(value)) > unitPx / 2) write(posOf(value), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, posOf, unitPx]);

  const onScroll = () => {
    scrolling.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { scrolling.current = false; }, 140);
    const v = valueAt(read());
    if (v !== value) onChange(v);
  };

  // mouse drag (touch uses the browser's own scrolling)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    drag.current = { start: horizontal ? e.clientX : e.clientY, from: read() };
    box.current!.classList.add('dragging');
    box.current!.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    write(drag.current.from - ((horizontal ? e.clientX : e.clientY) - drag.current.start));
  };
  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    box.current!.classList.remove('dragging');
    write(posOf(valueAt(read())), true);
  };

  const step = (d: number) => onChange(clamp(value + d));
  const onKey = (e: React.KeyboardEvent) => {
    const inc = horizontal ? 'ArrowRight' : 'ArrowUp';
    const dec = horizontal ? 'ArrowLeft' : 'ArrowDown';
    if (e.key === inc || e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === dec || e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'PageUp') { e.preventDefault(); step(10); }
    else if (e.key === 'PageDown') { e.preventDefault(); step(-10); }
  };

  const ticks: number[] = [];
  for (let v = reverse ? max : min; reverse ? v >= min : v <= max; v += reverse ? -1 : 1) ticks.push(v);

  return (
    <div className={`ruler ${horizontal ? 'ruler-h' : 'ruler-v'}`} style={{ '--u': `${unitPx}px` } as React.CSSProperties}>
      <button type="button" className="ruler-btn" onClick={() => step(horizontal ? -1 : 1)} aria-label={`${label} −`}>
        {horizontal ? <Minus size={18} /> : <Plus size={18} />}
      </button>
      <div className="ruler-view">
        <div
          ref={box} className="ruler-scroll" role="slider" tabIndex={0} aria-label={label}
          aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-orientation={horizontal ? 'horizontal' : 'vertical'}
          onScroll={onScroll} onKeyDown={onKey}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}
        >
          <div className="ruler-track" style={{ [horizontal ? 'width' : 'height']: ticks.length * unitPx } as React.CSSProperties}>
            {ticks.map(v => {
              const major = v % majorEvery === 0;
              const mid = !major && v % (majorEvery / 2) === 0;
              return (
                <span
                  key={v}
                  className={`tick${major ? ' major' : mid ? ' mid' : ''}`}
                  style={{ [horizontal ? 'width' : 'height']: unitPx } as React.CSSProperties}
                >
                  <i />
                  {major && <em>{v}</em>}
                </span>
              );
            })}
          </div>
        </div>
        <div className="ruler-mark" aria-hidden />
      </div>
      <button type="button" className="ruler-btn" onClick={() => step(horizontal ? 1 : -1)} aria-label={`${label} +`}>
        {horizontal ? <Plus size={18} /> : <Minus size={18} />}
      </button>
    </div>
  );
}
