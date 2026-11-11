'use client';

import React, { useMemo } from 'react';
import { Phone, MapPin, AlertTriangle } from 'lucide-react';
import { useKitchen } from '@/context/KitchenContext';
import { SLOT_LABEL_KA, SLOT_ORDER } from '@/lib/rationPlanHelper';
import { EmptyState, ProgressBar, TickButton } from './KitchenBits';

export const RationsView: React.FC = () => {
  const { ration, isChecked, toggleCheck, clientRemainingDays, isDataLoading } = useKitchen();

  const sentCount = ration.clients.filter(c => isChecked(`rsent:${c.id}`)).length;

  const bySlot = useMemo(
    () =>
      SLOT_ORDER.map(slot => ({
        slot,
        clients: ration.clients.filter(c => c.deliverySlot === slot),
      })).filter(g => g.clients.length > 0),
    [ration.clients]
  );

  return (
    <div className="kt-pane-inner">
      <div className="kt-kpis">
        <div className="kt-kpi kt-kpi-primary">
          <span className="kt-kpi-label">შეკვეთილი რაციონი</span>
          <span className="kt-kpi-value">{ration.clients.length}<small> კლიენტი</small></span>
        </div>
        <div className="kt-kpi kt-kpi-wide">
          <span className="kt-kpi-label">გაგზავნის პროგრესი</span>
          <ProgressBar done={sentCount} total={ration.clients.length} />
        </div>
      </div>

      {ration.byProgram.length > 0 && (
        <div className="kt-program-row">
          {ration.byProgram.map(p => (
            <span key={`${p.programTitle}-${p.calories}`} className="kt-program-pill">
              {p.programTitle} · {p.calories} კკალ <b>×{p.qty}</b>
            </span>
          ))}
        </div>
      )}

      {ration.clients.length === 0 && !isDataLoading && (
        <EmptyState
          icon="📦"
          title="ამ დღეს მისატანი რაციონი არ არის"
          hint="კლიენტის ბარათები დაემატება ჩანართში „კლიენტები“"
        />
      )}

      {bySlot.map(group => (
        <section key={group.slot} className="kt-section">
          <h2 className="kt-section-title">
            🕒 {SLOT_LABEL_KA[group.slot]} <span className="kt-section-note">{group.clients.length}</span>
          </h2>
          <div className="kt-grid">
            {group.clients.map(c => {
              const ref = `rsent:${c.id}`;
              const done = isChecked(ref);
              const left = clientRemainingDays(c);
              return (
                <article key={c.id} className={`kt-card kt-client ${done ? 'is-done' : ''}`}>
                  <div className="kt-client-head">
                    <h4 className="kt-card-title">{c.clientName}</h4>
                    <span className="kt-kcal">{c.calories} კკალ</span>
                  </div>
                  <div className="kt-client-program">{c.programTitle}</div>
                  <div className="kt-client-lines">
                    <a className="kt-line kt-line-link" href={`tel:${c.phone.replace(/\s/g, '')}`}>
                      <Phone size={16} aria-hidden="true" /> {c.phone || '—'}
                    </a>
                    <div className="kt-line">
                      <MapPin size={16} aria-hidden="true" /> {c.address || '—'}
                      {c.zone ? <span className="kt-muted"> · {c.zone}</span> : null}
                    </div>
                  </div>
                  {c.notes && (
                    <div className="kt-note">
                      <AlertTriangle size={16} aria-hidden="true" /> {c.notes}
                    </div>
                  )}
                  <div className="kt-client-foot">
                    <span className="kt-muted">დარჩა {left} დღე</span>
                  </div>
                  <TickButton
                    done={done}
                    label="გაგზავნილია?"
                    doneLabel="გაგზავნილია"
                    onToggle={() => toggleCheck(ref, 1)}
                  />
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
