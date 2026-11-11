'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Dish, Locale } from '@/types';
import { videoSrc } from '@/lib/rationDishesService';

export function DishVideoModal({ dish, locale, onClose }: { dish: Dish; locale: Locale; onClose: () => void }) {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    setPortrait(window.matchMedia('(max-width: 640px)').matches);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  const src = videoSrc(dish.slug, portrait);
  if (!src) return null;
  return (
    <div className="ord-sheet-back" onClick={onClose} role="presentation">
      <div className={`ord-vmodal ${portrait ? 'p' : ''}`} role="dialog" aria-modal="true" aria-label={dish.name[locale]} onClick={e => e.stopPropagation()}>
        <video src={src} autoPlay muted loop playsInline controls />
        <div className="ord-vmodal-cap">{dish.name[locale]}</div>
        <button type="button" className="ord-x ord-vmodal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
      </div>
    </div>
  );
}
