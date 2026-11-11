'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { LazyProductImage } from '@/components/partner/LazyProductImage';
import { useKitchen } from '@/context/KitchenContext';
import { SpoilageInfo } from '@/lib/kitchenPlanHelper';

/** Big thumb-sized tick. `label` is the action word, e.g. "მომზადებულია". */
export const TickButton: React.FC<{
  done: boolean;
  label: string;
  doneLabel?: string;
  onToggle: () => void;
  disabled?: boolean;
}> = ({ done, label, doneLabel, onToggle, disabled }) => (
  <button
    type="button"
    className={`kt-tick ${done ? 'is-done' : ''}`}
    onClick={onToggle}
    disabled={disabled}
    aria-pressed={done}
  >
    <span className="kt-tick-box" aria-hidden="true">
      <Check size={22} strokeWidth={3.2} />
    </span>
    <span className="kt-tick-label">{done ? doneLabel || label : label}</span>
  </button>
);

export const ProgressBar: React.FC<{ done: number; total: number; label?: string }> = ({ done, total, label }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="kt-progress" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
      <div className="kt-progress-track">
        <div className="kt-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="kt-progress-text">
        {label ? `${label} ` : ''}
        <b>{done}</b> / {total}
      </span>
    </div>
  );
};

const SPOIL_LABEL: Record<SpoilageInfo['level'], string> = {
  none: '',
  watch: 'დააკვირდით',
  high: 'ყურადღება',
  stale: 'არ მოამზადოთ',
};

/** Spoilage / stale warning with the reasons behind it, so the kitchen sees why a number was cut. */
export const SpoilNote: React.FC<{ spoilage: SpoilageInfo; stockNow: number; reduced: boolean }> = ({ spoilage, stockNow, reduced }) => {
  if (spoilage.level === 'none' || spoilage.reasons.length === 0) return null;
  return (
    <div className={`kt-spoil kt-spoil-${spoilage.level}`}>
      <span className="kt-spoil-tag">{SPOIL_LABEL[spoilage.level]}</span>
      <ul>
        {spoilage.reasons.map(r => (
          <li key={r}>{r}</li>
        ))}
        {reduced && spoilage.factor < 1 && spoilage.factor > 0 && (
          <li>პროგნოზი შემცირებულია {Math.round((1 - spoilage.factor) * 100)}%-ით</li>
        )}
        {spoilage.level === 'stale' && stockNow > 0 && <li>დარბაზში დარჩენილია {stockNow} ც — ჩამოწერის რისკი</li>}
      </ul>
    </div>
  );
};

export const EmptyState: React.FC<{ icon: string; title: string; hint?: string }> = ({ icon, title, hint }) => (
  <div className="kt-empty">
    <div className="kt-empty-icon" aria-hidden="true">{icon}</div>
    <div className="kt-empty-title">{title}</div>
    {hint && <div className="kt-empty-hint">{hint}</div>}
  </div>
);

export const MONTHS_KA = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
];

export const formatDateKa = (d: Date, weekday: string) => `${weekday}, ${d.getDate()} ${MONTHS_KA[d.getMonth()]}`;

/**
 * Dish photo. Hall products load theirs from partner_products (by id); ration dishes pass a static `src`.
 * Tap to enlarge — handy for checking plating on a tablet propped up in the kitchen.
 */
export const DishPhoto: React.FC<{
  productId?: string;
  src?: string;
  alt: string;
  icon?: string;
  size?: 'md' | 'lg';
}> = ({ productId, src, alt, icon = '🍽️', size = 'md' }) => {
  const { dishImage } = useKitchen();
  const [open, setOpen] = useState(false);
  const image = src || dishImage(productId);

  if (!image && !productId) {
    return <div className={`kt-photo kt-photo-${size} kt-photo-empty`} aria-hidden="true">{icon}</div>;
  }

  return (
    <>
      <button type="button" className={`kt-photo kt-photo-${size}`} onClick={() => setOpen(true)} aria-label={`${alt} — გადიდება`}>
        <LazyProductImage productId={productId || alt} src={image} alt={alt} sizes="160px" />
      </button>
      {open &&
        createPortal(
          <div className="kt-portal kt-lightbox" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label={alt}>
            <div className="kt-lightbox-frame" onClick={e => e.stopPropagation()}>
              <LazyProductImage productId={productId || alt} src={image} alt={alt} sizes="90vw" />
            </div>
            <div className="kt-lightbox-caption">{alt}</div>
            <button type="button" className="kt-icon-btn kt-lightbox-close" onClick={() => setOpen(false)} aria-label="დახურვა">
              <X size={26} />
            </button>
          </div>,
          document.body
        )}
    </>
  );
};
