'use client';

import React, { useState } from 'react';
import { RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { DayOffset, useKitchen } from '@/context/KitchenContext';
import { formatDateKa } from './KitchenBits';
import { NO_SWIPE_ATTR } from './useSwipe';

const DAYS: { offset: DayOffset; label: string }[] = [
  { offset: 0, label: 'დღეს' },
  { offset: 1, label: 'ხვალ' },
  { offset: 2, label: 'ზეგ' },
];

export const KitchenHeader: React.FC = () => {
  const { now, offset, setOffset, plan, syncMode, refresh } = useKitchen();
  const [spinning, setSpinning] = useState(false);

  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const share = Math.round(plan.dayShare * 100);

  return (
    <header className="kt-header" {...{ [NO_SWIPE_ATTR]: '' }}>
      <div className="kt-brand">
        <span className="kt-brand-name">FitFood</span>
        <span className="kt-brand-sub">სამზარეულო</span>
      </div>

      <div className="kt-day-switch" role="tablist" aria-label="დღე">
        {DAYS.map(d => (
          <button
            key={d.offset}
            type="button"
            role="tab"
            aria-selected={offset === d.offset}
            className={offset === d.offset ? 'is-active' : ''}
            onClick={() => setOffset(d.offset)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="kt-date">
        <div className="kt-date-main">{formatDateKa(plan.targetDate, plan.weekdayLabel)}</div>
        <div className="kt-date-sub">
          {time} · დღევანდელი გაყიდვების ≈{share}% უკვე გავიდა
        </div>
      </div>

      <div className="kt-header-actions">
        <span
          className={`kt-sync ${syncMode}`}
          title={
            syncMode === 'cloud'
              ? 'მონაცემები სინქრონიზებულია'
              : syncMode === 'local'
                ? 'ლოკალური რეჟიმი: მონიშვნები და ბარათები ინახება მხოლოდ ამ მოწყობილობაზე'
                : 'იტვირთება…'
          }
        >
          {syncMode === 'local' ? <CloudOff size={18} aria-hidden="true" /> : <Cloud size={18} aria-hidden="true" />}
          <span>{syncMode === 'cloud' ? 'ონლაინ' : syncMode === 'local' ? 'ლოკალური' : '…'}</span>
        </span>
        <button
          type="button"
          className="kt-icon-btn"
          aria-label="განახლება"
          onClick={async () => {
            setSpinning(true);
            await refresh();
            setTimeout(() => setSpinning(false), 400);
          }}
        >
          <RefreshCw size={22} className={spinning ? 'kt-spin' : ''} />
        </button>
      </div>
    </header>
  );
};
