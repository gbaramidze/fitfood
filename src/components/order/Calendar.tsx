'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Locale } from '@/types';
import { MONTH_NOM, WEEKDAY_SHORT, addDays, dayKey } from './orderData';

interface Props {
  locale: Locale;
  value: Date;
  min: Date;
  /** how many consecutive days the ration lasts (highlights the range after the start day) */
  days: number;
  onChange: (d: Date) => void;
}

/** Month calendar, Monday first, fully localized (ka / ru / en). */
export function Calendar({ locale, value, min, days, onChange }: Props) {
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

  const offset = (view.getDay() + 6) % 7; // Monday = 0
  const cells = Array.from({ length: 42 }, (_, i) => addDays(view, i - offset));
  const end = addDays(value, days - 1);
  const canPrev = view.getFullYear() * 12 + view.getMonth() > min.getFullYear() * 12 + min.getMonth();
  const shift = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));
  const weekdays = [1, 2, 3, 4, 5, 6, 0].map(i => WEEKDAY_SHORT[locale][i]);
  const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b);

  return (
    <div className="ord-cal">
      <div className="ord-cal-head">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <b>{MONTH_NOM[locale][view.getMonth()]} {view.getFullYear()}</b>
        <button type="button" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={18} /></button>
      </div>
      <div className="ord-cal-grid" role="grid">
        {weekdays.map(w => <span key={w} className="ord-cal-wd">{w}</span>)}
        {cells.map(d => {
          const disabled = d < min;
          const selected = sameDay(d, value);
          const inRange = d > value && d <= end;
          return (
            <button
              key={dayKey(d)} type="button" disabled={disabled}
              className={`ord-cal-day${d.getMonth() !== view.getMonth() ? ' other' : ''}${selected ? ' sel' : ''}${inRange ? ' range' : ''}${sameDay(d, end) && days > 1 ? ' last' : ''}`}
              aria-pressed={selected}
              onClick={() => onChange(d)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
