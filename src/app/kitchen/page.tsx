'use client';

import React, { useCallback, useState } from 'react';
import { ChefHat, Package, Store, Users } from 'lucide-react';
import { useKitchen } from '@/context/KitchenContext';
import { KitchenHeader } from '@/components/kitchen/KitchenHeader';
import { CookView } from '@/components/kitchen/CookView';
import { RationsView } from '@/components/kitchen/RationsView';
import { HallsView } from '@/components/kitchen/HallsView';
import { ClientsView } from '@/components/kitchen/ClientsView';
import { useArrowKeys, useSwipePager } from '@/components/kitchen/useSwipe';

type TabId = 'cook' | 'rations' | 'halls' | 'clients';

export default function KitchenPage() {
  const { plan, ration, isChecked, clients } = useKitchen();
  const [index, setIndex] = useState(0);

  const cookPending =
    plan.cookTotals.filter(t => !isChecked(`cook:${t.key}`)).length +
    (ration.clients.length > 0 ? ration.dishes.filter(d => !isChecked(`rcook:${d.dishId}`)).length : 0);
  const rationsPending = ration.clients.filter(c => !isChecked(`rsent:${c.id}`)).length;
  const hallsPending = plan.halls.reduce(
    (sum, h) => sum + h.items.filter(i => i.toPrepare > 0 && !isChecked(`send:${h.pointId}:${i.key}`)).length,
    0
  );
  const activeClients = clients.filter(c => c.status === 'active').length;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge: number; urgent: boolean }[] = [
    { id: 'cook', label: 'მოსამზადებელი', icon: <ChefHat size={26} />, badge: cookPending, urgent: true },
    { id: 'rations', label: 'რაციონები', icon: <Package size={26} />, badge: rationsPending, urgent: true },
    { id: 'halls', label: 'დარბაზები', icon: <Store size={26} />, badge: hallsPending, urgent: true },
    { id: 'clients', label: 'კლიენტები', icon: <Users size={26} />, badge: activeClients, urgent: false },
  ];

  const go = useCallback((i: number) => setIndex(Math.max(0, Math.min(tabs.length - 1, i))), [tabs.length]);
  const { dragX, dragging, handlers } = useSwipePager({ index, count: tabs.length, onChange: go });
  useArrowKeys(
    useCallback(() => setIndex(i => Math.max(0, i - 1)), []), // ←
    useCallback(() => setIndex(i => Math.min(3, i + 1)), []) // →
  );

  return (
    <div className="kt-root">
      <KitchenHeader />

      <div className="kt-viewport" {...handlers}>
        <div
          className={`kt-track ${dragging ? 'is-dragging' : ''}`}
          style={{ transform: `translate3d(calc(${-index * 100}% + ${dragX}px), 0, 0)` }}
        >
          {tabs.map((t, i) => {
            const near = Math.abs(i - index) <= 1 && dragging;
            return (
              <section
                key={t.id}
                className="kt-pane"
                role="tabpanel"
                aria-hidden={i !== index}
                data-active={i === index}
                data-near={near}
                // Off-screen panes must not be reachable by keyboard / screen reader.
                {...(i !== index && !near ? { inert: true } : {})}
              >
                {t.id === 'cook' && <CookView />}
                {t.id === 'rations' && <RationsView />}
                {t.id === 'halls' && (
                  <HallsView onEdge={dir => go(index + (dir === 'next' ? 1 : -1))} />
                )}
                {t.id === 'clients' && <ClientsView />}
              </section>
            );
          })}
        </div>
      </div>

      <nav className="kt-nav" role="tablist" aria-label="ნავიგაცია">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`kt-nav-item ${i === index ? 'is-active' : ''}`}
            onClick={() => go(i)}
          >
            <span className="kt-nav-icon">
              {t.icon}
              {t.badge > 0 && (
                <span className={`kt-nav-badge ${t.urgent ? 'urgent' : ''}`}>{t.badge}</span>
              )}
            </span>
            <span className="kt-nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
