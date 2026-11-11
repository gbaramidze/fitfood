'use client';

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Phone, MapPin, Plus, Search, X, AlertTriangle } from 'lucide-react';
import { useKitchen } from '@/context/KitchenContext';
import { programs } from '@/data/programs';
import { dayKeyOf } from '@/lib/salesForecastHelper';
import { SLOT_LABEL_KA, SLOT_ORDER } from '@/lib/rationPlanHelper';
import { KitchenClient, KitchenClientStatus, KitchenDeliverySlot } from '@/types/kitchen';
import { EmptyState } from './KitchenBits';
import { NO_SWIPE_ATTR } from './useSwipe';

const STATUS_LABEL: Record<KitchenClientStatus, string> = {
  active: 'აქტიური',
  paused: 'პაუზა',
  completed: 'დასრულებული',
};

const CALORIE_PRESETS = [1200, 1500, 1800, 2000, 2500];
const DAY_PRESETS = [2, 6, 12, 24, 30];

type Draft = Omit<KitchenClient, 'id' | 'createdAt'> & { id?: string };

const emptyDraft = (): Draft => ({
  clientName: '',
  phone: '+995 ',
  address: '',
  zone: '',
  programId: programs[0]?.id || '',
  programTitle: programs[0]?.title.ka || '',
  calories: 1500,
  totalDays: 30,
  deliveredDays: 0,
  deliverySlot: 'morning',
  startDate: dayKeyOf(new Date()),
  status: 'active',
  notes: '',
});

export const ClientsView: React.FC = () => {
  const { clients, saveClient, deleteClient, clientRemainingDays, syncMode } = useKitchen();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<KitchenClientStatus | 'all'>('active');
  const [draft, setDraft] = useState<Draft | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter(c => {
      if (status !== 'all' && c.status !== status) return false;
      if (!q) return true;
      return (
        c.clientName.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        c.address.toLowerCase().includes(q)
      );
    });
  }, [clients, query, status]);

  const counts = useMemo(
    () => ({
      all: clients.length,
      active: clients.filter(c => c.status === 'active').length,
      paused: clients.filter(c => c.status === 'paused').length,
      completed: clients.filter(c => c.status === 'completed').length,
    }),
    [clients]
  );

  return (
    <div className="kt-pane-inner">
      <div className="kt-toolbar kt-toolbar-wrap">
        <label className="kt-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            inputMode="search"
            placeholder="ძებნა: სახელი, ტელეფონი, მისამართი"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>
        <button type="button" className="kt-btn kt-btn-primary" onClick={() => setDraft(emptyDraft())}>
          <Plus size={20} aria-hidden="true" /> ახალი კლიენტი
        </button>
      </div>

      <div className="kt-chips" role="tablist" aria-label="სტატუსი" {...{ [NO_SWIPE_ATTR]: '' }}>
        {(['active', 'paused', 'completed', 'all'] as const).map(s => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={status === s}
            className={`kt-chip ${status === s ? 'is-active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s === 'all' ? 'ყველა' : STATUS_LABEL[s]} <span className="kt-chip-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {syncMode === 'local' && (
        <div className="kt-banner">
          ბარათები ინახება მხოლოდ ამ მოწყობილობაზე. სხვა პლანშეტებთან სინქრონისთვის გაუშვით <code>supabase/add_kitchen_tables.sql</code> Supabase-ში.
        </div>
      )}

      {filtered.length === 0 && (
        <EmptyState
          icon="👤"
          title={clients.length === 0 ? 'კლიენტის ბარათები ჯერ არ არის' : 'ამ ფილტრით ვერაფერი მოიძებნა'}
          hint={clients.length === 0 ? 'დააჭირეთ „ახალი კლიენტი“ — მისი რაციონი ავტომატურად გამოჩნდება მომზადების გეგმაში' : undefined}
        />
      )}

      <div className="kt-grid">
        {filtered.map(c => {
          const left = clientRemainingDays(c);
          const doneDays = Math.max(0, c.totalDays - left);
          const pct = c.totalDays > 0 ? Math.min(100, Math.round((doneDays / c.totalDays) * 100)) : 0;
          return (
            <button
              key={c.id}
              type="button"
              className={`kt-card kt-client kt-client-btn status-${c.status}`}
              onClick={() => setDraft({ ...c })}
            >
              <div className="kt-client-head">
                <h4 className="kt-card-title">{c.clientName}</h4>
                <span className={`kt-status status-${c.status}`}>{STATUS_LABEL[c.status]}</span>
              </div>
              <div className="kt-client-program">
                {c.programTitle} · <b>{c.calories} კკალ</b>
              </div>
              <div className="kt-client-lines">
                <span className="kt-line"><Phone size={16} aria-hidden="true" /> {c.phone || '—'}</span>
                <span className="kt-line">
                  <MapPin size={16} aria-hidden="true" /> {c.address || '—'}
                  {c.zone ? <span className="kt-muted"> · {c.zone}</span> : null}
                </span>
                <span className="kt-line kt-muted">🕒 {SLOT_LABEL_KA[c.deliverySlot]}</span>
              </div>
              {c.notes && (
                <div className="kt-note">
                  <AlertTriangle size={16} aria-hidden="true" /> {c.notes}
                </div>
              )}
              <div className="kt-client-days">
                <div className="kt-progress-track"><div className="kt-progress-fill" style={{ width: `${pct}%` }} /></div>
                <span className="kt-muted">დარჩა <b>{left}</b> / {c.totalDays} დღე</span>
              </div>
            </button>
          );
        })}
      </div>

      {draft && (
        <ClientSheet
          draft={draft}
          isNew={!draft.id}
          onClose={() => setDraft(null)}
          onSave={d => {
            saveClient(d);
            setDraft(null);
          }}
          onDelete={
            draft.id
              ? () => {
                  deleteClient(draft.id!);
                  setDraft(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

const ClientSheet: React.FC<{
  draft: Draft;
  isNew: boolean;
  onClose: () => void;
  onSave: (d: Draft) => void;
  onDelete?: () => void;
}> = ({ draft, isNew, onClose, onSave, onDelete }) => {
  const [d, setD] = useState<Draft>(draft);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(prev => ({ ...prev, [k]: v }));

  const valid = d.clientName.trim().length > 0 && d.totalDays > 0 && d.calories > 0;

  // Rendered on <body>: the pager is CSS-transformed, which would turn `position: fixed` into
  // "fixed relative to the sliding track" and push the sheet off screen.
  return createPortal(
    <div className="kt-portal kt-sheet-backdrop" onClick={onClose} {...{ [NO_SWIPE_ATTR]: '' }}>
      <form
        className="kt-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'ახალი კლიენტი' : 'კლიენტის ბარათი'}
        onClick={e => e.stopPropagation()}
        onSubmit={e => {
          e.preventDefault();
          if (valid) onSave({ ...d, clientName: d.clientName.trim(), notes: d.notes?.trim() || undefined });
        }}
      >
        <header className="kt-sheet-head">
          <h3>{isNew ? 'ახალი კლიენტი' : 'კლიენტის ბარათი'}</h3>
          <button type="button" className="kt-icon-btn" onClick={onClose} aria-label="დახურვა">
            <X size={24} />
          </button>
        </header>

        <div className="kt-sheet-body">
          <label className="kt-field kt-field-wide">
            <span>სახელი და გვარი *</span>
            <input value={d.clientName} onChange={e => set('clientName', e.target.value)} autoComplete="off" />
          </label>
          <label className="kt-field">
            <span>ტელეფონი</span>
            <input type="tel" inputMode="tel" value={d.phone} onChange={e => set('phone', e.target.value)} />
          </label>
          <label className="kt-field">
            <span>ზონა / უბანი</span>
            <input value={d.zone} onChange={e => set('zone', e.target.value)} />
          </label>
          <label className="kt-field kt-field-wide">
            <span>მისამართი</span>
            <input value={d.address} onChange={e => set('address', e.target.value)} />
          </label>

          <label className="kt-field kt-field-wide">
            <span>პროგრამა</span>
            <select
              value={d.programId}
              onChange={e => {
                const p = programs.find(x => x.id === e.target.value);
                setD(prev => ({ ...prev, programId: e.target.value, programTitle: p?.title.ka || prev.programTitle }));
              }}
            >
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.title.ka}</option>
              ))}
            </select>
          </label>

          <div className="kt-field kt-field-wide">
            <span>კალორიულობა (კკალ)</span>
            <div className="kt-seg" {...{ [NO_SWIPE_ATTR]: '' }}>
              {CALORIE_PRESETS.map(c => (
                <button key={c} type="button" className={d.calories === c ? 'is-active' : ''} onClick={() => set('calories', c)}>
                  {c}
                </button>
              ))}
              <input
                type="number"
                inputMode="numeric"
                min={500}
                max={5000}
                value={d.calories}
                onChange={e => set('calories', Number(e.target.value) || 0)}
                aria-label="კალორიულობა"
              />
            </div>
          </div>

          <div className="kt-field kt-field-wide">
            <span>სულ დღეები</span>
            <div className="kt-seg" {...{ [NO_SWIPE_ATTR]: '' }}>
              {DAY_PRESETS.map(n => (
                <button key={n} type="button" className={d.totalDays === n ? 'is-active' : ''} onClick={() => set('totalDays', n)}>
                  {n}
                </button>
              ))}
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={d.totalDays}
                onChange={e => set('totalDays', Number(e.target.value) || 0)}
                aria-label="სულ დღეები"
              />
            </div>
          </div>

          <label className="kt-field">
            <span>უკვე მიტანილი დღეები</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={d.deliveredDays}
              onChange={e => set('deliveredDays', Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label className="kt-field">
            <span>დაწყების თარიღი</span>
            <input type="date" value={d.startDate} onChange={e => set('startDate', e.target.value)} />
          </label>

          <div className="kt-field kt-field-wide">
            <span>მიტანის დრო</span>
            <div className="kt-seg kt-seg-3" {...{ [NO_SWIPE_ATTR]: '' }}>
              {SLOT_ORDER.map((s: KitchenDeliverySlot) => (
                <button key={s} type="button" className={d.deliverySlot === s ? 'is-active' : ''} onClick={() => set('deliverySlot', s)}>
                  {SLOT_LABEL_KA[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="kt-field kt-field-wide">
            <span>სტატუსი</span>
            <div className="kt-seg kt-seg-3" {...{ [NO_SWIPE_ATTR]: '' }}>
              {(['active', 'paused', 'completed'] as const).map(s => (
                <button key={s} type="button" className={d.status === s ? 'is-active' : ''} onClick={() => set('status', s)}>
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <label className="kt-field kt-field-wide">
            <span>შენიშვნა / ალერგია / სტოპ-ლისტი</span>
            <textarea rows={3} value={d.notes || ''} onChange={e => set('notes', e.target.value)} />
          </label>
        </div>

        <footer className="kt-sheet-foot">
          {onDelete &&
            (confirmDelete ? (
              <button type="button" className="kt-btn kt-btn-danger" onClick={onDelete}>
                დიახ, წაშალე
              </button>
            ) : (
              <button type="button" className="kt-btn kt-btn-ghost-danger" onClick={() => setConfirmDelete(true)}>
                წაშლა
              </button>
            ))}
          <span className="kt-spacer" />
          <button type="button" className="kt-btn" onClick={onClose}>გაუქმება</button>
          <button type="submit" className="kt-btn kt-btn-primary" disabled={!valid}>შენახვა</button>
        </footer>
      </form>
    </div>,
    document.body
  );
};
