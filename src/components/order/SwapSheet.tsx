'use client';

import React, { useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { Dish, Locale } from '@/types';
import { swapCandidates } from '@/lib/rationRotation';
import { T } from './orderData';
import { DishImage } from './DishImage';

interface Props {
  locale: Locale;
  current: Dish;
  pool: Dish[];
  /** allergens a dish contains, in the customer's language */
  allergensOf: (d: Dish) => string[];
  onPick: (d: Dish) => void;
  onClose: () => void;
}

export function SwapSheet({ locale, current, pool, allergensOf, onPick, onClose }: Props) {
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

  const list = swapCandidates(current, pool).map(d => ({ d, has: allergensOf(d) }));

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
        <div className="ord-sheet-list">
          {list.map(({ d, has }) => (
            <button key={d.id} type="button" className="ord-cand" onClick={() => onPick(d)}>
              <DishImage src={d.image} alt={d.name[locale]} />
              <div>
                <b>{d.name[locale]}</b>
                <div className="ord-macros">
                  <span>{d.macros.calories} {T.kcal[locale]}</span>
                  <span>{T.protein[locale]} {d.macros.protein}</span>
                  <span>{T.fat[locale]} {d.macros.fat}</span>
                  <span>{T.carbs[locale]} {d.macros.carbs}</span>
                </div>
                {has.length > 0 && <div className="ord-contains">{T.contains[locale]}: {has.join(', ')}</div>}
              </div>
              <ChevronRight size={18} color="#64748b" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
