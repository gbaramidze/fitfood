'use client';

import React, { useMemo, useState } from 'react';
import { useKitchen } from '@/context/KitchenContext';
import { COOK_CATEGORIES } from '@/lib/cookCommissionHelper';
import { MEAL_LABEL_KA } from '@/lib/rationPlanHelper';
import { DishPhoto, EmptyState, ProgressBar, TickButton } from './KitchenBits';
import { NO_SWIPE_ATTR } from './useSwipe';

type Scope = 'all' | 'halls' | 'rations';

const SCOPES: { id: Scope; label: string }[] = [
  { id: 'all', label: 'ყველა' },
  { id: 'halls', label: 'დარბაზები' },
  { id: 'rations', label: 'რაციონები' },
];

export const CookView: React.FC = () => {
  const { plan, ration, isChecked, checkedQty, toggleCheck, isDataLoading } = useKitchen();
  const [scope, setScope] = useState<Scope>('all');

  const hallGroups = useMemo(() => {
    const byCat = new Map<string, typeof plan.cookTotals>();
    plan.cookTotals.forEach(t => {
      const list = byCat.get(t.categoryId) || [];
      list.push(t);
      byCat.set(t.categoryId, list);
    });
    return Array.from(byCat.entries()).map(([id, items]) => ({
      id,
      label: COOK_CATEGORIES.find(c => c.id === id)?.label || 'სხვა',
      icon: COOK_CATEGORIES.find(c => c.id === id)?.icon || '🍽️',
      items,
    }));
  }, [plan]);

  const hallDone = plan.cookTotals.filter(t => isChecked(`cook:${t.key}`)).length;
  const rationDone = ration.dishes.filter(d => isChecked(`rcook:${d.dishId}`)).length;

  const showHalls = scope !== 'rations';
  const showRations = scope !== 'halls';
  const hallPortions = plan.totalToPrepare;
  const rationPortions = ration.dishes.reduce((s, d) => s + d.total, 0);

  const nothing =
    (!showHalls || plan.cookTotals.length === 0) && (!showRations || ration.dishes.length === 0 || ration.clients.length === 0);

  return (
    <div className="kt-pane-inner">
      <div className="kt-kpis">
        <div className="kt-kpi kt-kpi-primary">
          <span className="kt-kpi-label">დარბაზებისთვის</span>
          <span className="kt-kpi-value">{hallPortions}<small> ულუფა</small></span>
        </div>
        <div className="kt-kpi">
          <span className="kt-kpi-label">რაციონებისთვის</span>
          <span className="kt-kpi-value">{rationPortions}<small> ულუფა</small></span>
        </div>
        <div className="kt-kpi kt-kpi-wide">
          <span className="kt-kpi-label">მომზადების პროგრესი</span>
          <ProgressBar
            done={(showHalls ? hallDone : 0) + (showRations ? rationDone : 0)}
            total={(showHalls ? plan.cookTotals.length : 0) + (showRations ? ration.dishes.length : 0)}
          />
        </div>
      </div>

      <div className="kt-chips" role="tablist" aria-label="ფილტრი" {...{ [NO_SWIPE_ATTR]: '' }}>
        {SCOPES.map(s => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={scope === s.id}
            className={`kt-chip ${scope === s.id ? 'is-active' : ''}`}
            onClick={() => setScope(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isDataLoading && plan.halls.length === 0 && <EmptyState icon="⏳" title="იტვირთება…" />}

      {!isDataLoading && nothing && (
        <EmptyState
          icon="✅"
          title="ამ დღისთვის მოსამზადებელი არაფერია"
          hint="დარბაზებში ნაშთი საკმარისია, ან პროგნოზისთვის გაყიდვების ისტორია ჯერ არ არის"
        />
      )}

      {showHalls && plan.cookTotals.length > 0 && (
        <section className="kt-section">
          <h2 className="kt-section-title">🏢 დარბაზის კერძები</h2>
          {hallGroups.map(g => (
            <div key={g.id} className="kt-group">
              <h3 className="kt-group-title"><span aria-hidden="true">{g.icon}</span> {g.label}</h3>
              <div className="kt-grid">
                {g.items.map(t => {
                  const ref = `cook:${t.key}`;
                  const done = isChecked(ref);
                  const snap = checkedQty(ref);
                  const extra = done && snap !== undefined && t.total > snap ? t.total - snap : 0;
                  return (
                    <article key={t.key} className={`kt-card ${done ? 'is-done' : ''}`}>
                      <div className="kt-card-main">
                        <DishPhoto productId={t.productId} alt={t.productName} icon={t.categoryIcon} />
                        <div className="kt-card-text">
                          <h4 className="kt-card-title">{t.productName}</h4>
                          <div className="kt-hall-chips">
                            {t.halls.map(h => (
                              <span key={h.pointId} className="kt-hall-chip" title="პროგნოზი − ნაშთი">
                                {h.pointName} <b>{h.qty}</b>
                                {h.carry > 0 && <em> ({h.demand}−{h.carry})</em>}
                              </span>
                            ))}
                          </div>
                          {extra > 0 && <div className="kt-warn-line">⚠ გეგმა გაიზარდა: დაამატეთ კიდევ {extra} ც</div>}
                        </div>
                        <div className="kt-bignum" aria-label={`${t.total} ულუფა`}>
                          <span>{done && snap !== undefined ? snap : t.total}</span>
                          <small>ც</small>
                        </div>
                      </div>
                      <TickButton
                        done={done}
                        label="მომზადებულია?"
                        doneLabel="მომზადებულია"
                        onToggle={() => toggleCheck(ref, t.total)}
                      />
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {showRations && ration.dishes.length > 0 && ration.clients.length > 0 && (
        <section className="kt-section">
          <h2 className="kt-section-title">
            🍱 რაციონების კერძები <span className="kt-section-note">{ration.clients.length} კლიენტი</span>
          </h2>
          <div className="kt-grid">
            {ration.dishes.map(d => {
              const ref = `rcook:${d.dishId}`;
              const done = isChecked(ref);
              const snap = checkedQty(ref);
              const extra = done && snap !== undefined && d.total > snap ? d.total - snap : 0;
              return (
                <article key={d.dishId} className={`kt-card ${done ? 'is-done' : ''}`}>
                  <div className="kt-card-main">
                    <DishPhoto productId={d.dishId} src={d.image} alt={d.name} />
                    <div className="kt-card-text">
                      <div className="kt-meal-tag">{MEAL_LABEL_KA[d.mealType]}</div>
                      <h4 className="kt-card-title">{d.name}</h4>
                      <div className="kt-hall-chips">
                        {d.byCalories.map(c => (
                          <span key={c.calories} className="kt-hall-chip">
                            {c.calories} კკალ <b>×{c.qty}</b>
                          </span>
                        ))}
                      </div>
                      {d.clientsWithNotes > 0 && (
                        <div className="kt-warn-line">⚠ {d.clientsWithNotes} კლიენტს აქვს ალერგია / შენიშვნა</div>
                      )}
                      {extra > 0 && <div className="kt-warn-line">⚠ გეგმა გაიზარდა: დაამატეთ კიდევ {extra} ულუფა</div>}
                    </div>
                    <div className="kt-bignum">
                      <span>{done && snap !== undefined ? snap : d.total}</span>
                      <small>ულუფა</small>
                    </div>
                  </div>
                  <TickButton
                    done={done}
                    label="მომზადებულია?"
                    doneLabel="მომზადებულია"
                    onToggle={() => toggleCheck(ref, d.total)}
                  />
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
