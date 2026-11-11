'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { Dish, Locale } from '@/types';
import { swapCandidates } from '@/lib/rationRotation';
import { T } from './orderData';

interface Props {
  locale: Locale;
  current: Dish;
  pool: Dish[];
  /** returns the stop-list names a dish conflicts with (empty = safe) */
  conflicts: (d: Dish) => string[];
  onPick: (d: Dish) => void;
  onClose: () => void;
}

export function SwapSheet({ locale, current, pool, conflicts, onPick, onClose }: Props) {
  const [safeOnly, setSafeOnly] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const list = swapCandidates(current, pool)
    .map(d => ({ d, bad: conflicts(d) }))
    .filter(x => !safeOnly || x.bad.length === 0)
    .sort((a, b) => a.bad.length - b.bad.length);

  return (
    <div className="ord-sheet-back" onClick={onClose} role="presentation">
      <div className="ord-sheet" role="dialog" aria-modal="true" aria-label={T.swapTitle[locale]} onClick={e => e.stopPropagation()}>
        <div className="ord-sheet-head">
          <div>
            <h3>{T.swapTitle[locale]}</h3>
            <small>{current.name[locale]}</small>
          </div>
          <button type="button" className="ord-x" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="ord-sheet-tools">
          <button type="button" className="ord-chip sm" aria-pressed={safeOnly} onClick={() => setSafeOnly(v => !v)}>
            {T.safeOnly[locale]}
          </button>
        </div>
        <div className="ord-sheet-list">
          {list.map(({ d, bad }) => (
            <button key={d.id} type="button" className={`ord-cand ${bad.length ? 'bad' : ''}`} onClick={() => onPick(d)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image} alt="" loading="lazy" />
              <div>
                <b>{d.name[locale]}</b>
                <div className="ord-macros">
                  <span>{d.macros.calories} {T.kcal[locale]}</span>
                  <span>{T.protein[locale]} {d.macros.protein}</span>
                  <span>{T.fat[locale]} {d.macros.fat}</span>
                  <span>{T.carbs[locale]} {d.macros.carbs}</span>
                </div>
                {bad.length > 0 && (
                  <div className="ord-warn" style={{ marginTop: 6 }}>
                    <AlertTriangle size={13} /> {T.conflict[locale]}: {bad.join(', ')}
                  </div>
                )}
              </div>
              <ChevronRight size={18} color="#64748b" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
