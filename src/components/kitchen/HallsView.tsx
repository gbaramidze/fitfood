'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useKitchen } from '@/context/KitchenContext';
import { KitchenItem } from '@/lib/kitchenPlanHelper';
import { DishPhoto, EmptyState, ProgressBar, SpoilNote, TickButton } from './KitchenBits';
import { NO_SWIPE_ATTR, useSwipeGesture } from './useSwipe';

/**
 * Per-hall board: what is on the shelf, what will still sell today, what we send.
 * Swiping inside the hall area moves between halls; swiping past the first / last hall
 * falls through to the neighbouring tab.
 */
export const HallsView: React.FC<{ onEdge: (dir: 'prev' | 'next') => void }> = ({ onEdge }) => {
  const { plan, isChecked, checkedQty, toggleCheck, isDataLoading } = useKitchen();
  const [hallId, setHallId] = useState<string | null>(null);
  const [onlySend, setOnlySend] = useState(false);
  const [slide, setSlide] = useState<'from-left' | 'from-right' | null>(null);

  const halls = plan.halls;
  const activeIndex = Math.max(0, halls.findIndex(h => h.pointId === hallId));
  const hall = halls[activeIndex];

  useEffect(() => {
    if (halls.length && !halls.some(h => h.pointId === hallId)) setHallId(halls[0].pointId);
  }, [halls, hallId]);

  const goto = (index: number, dir: 'from-left' | 'from-right') => {
    setSlide(dir);
    setHallId(halls[index].pointId);
  };

  const swipe = useSwipeGesture(dir => {
    if (dir === 'left') {
      if (activeIndex < halls.length - 1) goto(activeIndex + 1, 'from-right');
      else onEdge('next');
    } else {
      if (activeIndex > 0) goto(activeIndex - 1, 'from-left');
      else onEdge('prev');
    }
  });

  const items = useMemo(
    () => (hall ? hall.items.filter(i => !onlySend || i.toPrepare > 0) : []),
    [hall, onlySend]
  );

  const sendable = hall ? hall.items.filter(i => i.toPrepare > 0) : [];
  const sentCount = hall ? sendable.filter(i => isChecked(`send:${hall.pointId}:${i.key}`)).length : 0;

  if (!hall) {
    return (
      <div className="kt-pane-inner">
        <EmptyState
          icon="🏢"
          title={isDataLoading ? 'იტვირთება…' : 'აქტიური დარბაზები არ მოიძებნა'}
          hint={isDataLoading ? undefined : 'დარბაზები ემატება ადმინისტრატორის პანელში → წერტილების პარამეტრები'}
        />
      </div>
    );
  }

  const isToday = plan.daysAhead === 0;

  return (
    <div className="kt-pane-inner">
      <div className="kt-chips kt-chips-scroll" role="tablist" aria-label="დარბაზები" {...{ [NO_SWIPE_ATTR]: '' }}>
        {halls.map((h, i) => (
          <button
            key={h.pointId}
            type="button"
            role="tab"
            aria-selected={h.pointId === hall.pointId}
            className={`kt-chip kt-chip-hall ${h.pointId === hall.pointId ? 'is-active' : ''}`}
            onClick={() => goto(i, i > activeIndex ? 'from-right' : 'from-left')}
          >
            {h.pointName}
            {h.totalToPrepare > 0 && <span className="kt-chip-badge">{h.totalToPrepare}</span>}
          </button>
        ))}
      </div>

      <div
        key={hall.pointId}
        className={`kt-hall-body ${slide ? `slide-${slide}` : ''}`}
        {...{ [NO_SWIPE_ATTR]: '' }}
        {...swipe}
      >
        <div className="kt-kpis">
          <div className="kt-kpi kt-kpi-primary">
            <span className="kt-kpi-label">{isToday ? 'გასაგზავნი დღეს' : 'გასაგზავნი'}</span>
            <span className="kt-kpi-value">{hall.totalToPrepare}<small> ც</small></span>
          </div>
          <div className="kt-kpi">
            <span className="kt-kpi-label">ნაშთი დარბაზში</span>
            <span className="kt-kpi-value">{hall.totalStock}<small> ც</small></span>
          </div>
          {hall.riskItems > 0 && (
            <div className="kt-kpi kt-kpi-warn">
              <span className="kt-kpi-label">გაფუჭების რისკი</span>
              <span className="kt-kpi-value">{hall.riskItems}<small> პოზიცია</small></span>
            </div>
          )}
          <div className="kt-kpi kt-kpi-wide">
            <span className="kt-kpi-label">გაგზავნის პროგრესი</span>
            <ProgressBar done={sentCount} total={sendable.length} />
          </div>
        </div>

        <div className="kt-toolbar">
          <div className="kt-muted kt-hall-address">{hall.pointAddress}</div>
          <button
            type="button"
            className={`kt-chip ${onlySend ? 'is-active' : ''}`}
            onClick={() => setOnlySend(v => !v)}
            aria-pressed={onlySend}
          >
            მხოლოდ გასაგზავნი
          </button>
        </div>

        {items.length === 0 && (
          <EmptyState
            icon="✅"
            title="ამ დარბაზში გასაგზავნი არაფერია"
            hint="ნაშთი და დღევანდელი გაყიდვები ფარავს პროგნოზს"
          />
        )}

        <div className="kt-list">
          {items.map(it => (
            <HallRow
              key={it.key}
              item={it}
              isToday={isToday}
              done={isChecked(`send:${hall.pointId}:${it.key}`)}
              snapshot={checkedQty(`send:${hall.pointId}:${it.key}`)}
              onToggle={() => toggleCheck(`send:${hall.pointId}:${it.key}`, it.toPrepare)}
            />
          ))}
        </div>

        {halls.length > 1 && (
          <div className="kt-swipe-hint" aria-hidden="true">
            ← გადაფურცლეთ დარბაზების გადასართავად →
          </div>
        )}
      </div>
    </div>
  );
};

const HallRow: React.FC<{
  item: KitchenItem;
  isToday: boolean;
  done: boolean;
  snapshot?: number;
  onToggle: () => void;
}> = ({ item, isToday, done, snapshot, onToggle }) => {
  const needs = item.toPrepare > 0;
  const extra = done && snapshot !== undefined && item.toPrepare > snapshot ? item.toPrepare - snapshot : 0;
  const demand = item.adjustedForecast + item.preorderQty;
  const cut = item.rawForecast > item.adjustedForecast ? item.rawForecast - item.adjustedForecast : 0;

  return (
    <article className={`kt-row ${done ? 'is-done' : ''} ${!needs ? 'is-enough' : ''} kt-spoil-row-${item.spoilage.level}`}>
      <div className="kt-row-head">
        <DishPhoto productId={item.productId} alt={item.productName} icon={item.categoryIcon} />
        <div className="kt-row-name">{item.productName}</div>
        <div className="kt-row-trend">
          {item.trend === 'growth' && <span className="kt-trend up">⬆ +{item.trendPercent}%</span>}
          {item.trend === 'decline' && <span className="kt-trend down">⬇ {item.trendPercent}%</span>}
        </div>
      </div>

      {/* The arithmetic, left to right: demand − what is already there = what to send. */}
      <div className="kt-math">
        <Metric label={isToday ? 'დარჩენილი მოთხოვნა' : 'პროგნოზი'} value={demand - item.preorderQty} sub={cut > 0 ? `−${cut} გაფუჭების გამო` : undefined} />
        {item.preorderQty > 0 && <Metric label="წინასწარი" value={item.preorderQty} tone="pink" />}
        <span className="kt-math-op" aria-hidden="true">−</span>
        <Metric
          label={isToday ? 'ნაშთი ახლა' : 'დარჩება ხვალისთვის'}
          value={item.carryOver}
          sub={!isToday ? `ახლა ${item.stockNow}, დღეს გაიყიდება ~${item.expectedRemainingToday}${item.todayPreorders ? ` (+${item.todayPreorders} წინასწარი)` : ''}` : undefined}
        />
        <span className="kt-math-op" aria-hidden="true">=</span>
        <div className={`kt-send ${needs ? 'need' : 'ok'}`}>
          <span className="kt-send-label">{needs ? 'გაგზავნეთ' : 'საკმარისია'}</span>
          <span className="kt-send-value">{needs ? (done && snapshot !== undefined ? snapshot : item.toPrepare) : 0}</span>
        </div>
      </div>

      <div className="kt-row-meta">
        <span>გაიყიდა დღეს: <b>{item.soldToday}</b></span>
        <span>ნაშთი: <b>{item.stockNow}</b></span>
        {item.confidence === 'low' && item.dataPoints < 2 && <span className="kt-muted">დაბალი სანდოობა</span>}
      </div>

      <SpoilNote spoilage={item.spoilage} stockNow={item.stockNow} reduced={cut > 0} />
      {extra > 0 && <div className="kt-warn-line">⚠ გეგმა გაიზარდა: გაგზავნეთ კიდევ {extra} ც</div>}

      {needs && (
        <TickButton done={done} label="გაგზავნილია?" doneLabel="გაგზავნილია" onToggle={onToggle} />
      )}
    </article>
  );
};

const Metric: React.FC<{ label: string; value: number; sub?: string; tone?: 'pink' }> = ({ label, value, sub, tone }) => (
  <div className={`kt-metric ${tone ? `tone-${tone}` : ''}`}>
    <span className="kt-metric-label">{label}</span>
    <span className="kt-metric-value">{value}</span>
    {sub && <span className="kt-metric-sub">{sub}</span>}
  </div>
);
