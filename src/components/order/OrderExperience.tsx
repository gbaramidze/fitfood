'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, Clock, Dumbbell, Flame, Leaf,
  Repeat, ShieldCheck, Sparkles, Zap, Plus, X, MapPin, ChefHat, Truck, Phone, Play, User,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Dish, Locale, Program } from '@/types';
import { programs } from '@/data/programs';
import { batumiZones } from '@/data/batumiZones';
import { ALLERGENS_DATABASE } from '@/data/allergensList';
import { menuForDate } from '@/lib/rationRotation';
import { useRationDishes, videoSrc } from '@/lib/rationDishesService';
import { kitchenDbService } from '@/services/kitchenDbService';
import { KitchenClient } from '@/types/kitchen';
import {
  CALORIE_OPTIONS, CONTACT, DURATIONS, SLOTS, PayId, SlotId, T, addDays, dayKey, fmtDate, tierPrice,
} from './orderData';
import { SwapSheet } from './SwapSheet';
import { SignatureFilms } from './SignatureFilms';
import { DishVideoModal } from './DishVideoModal';
import { Calendar } from './Calendar';
import './order.css';

const LANGS: { code: Locale; label: string }[] = [
  { code: 'ka', label: 'KA' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/** "Chicken fillet — 130 g" -> "Chicken fillet" (the database keeps weights inside the ingredient lines) */
const plainIngredient = (x: string) => x.replace(/\s*[—–]\s*[\d.,]+\s*(გ|მლ|г|мл|g|ml)\.?\s*$/i, '').trim();

const PROGRAM_ICON: Record<string, React.ReactNode> = {
  'prog-slim': <Flame size={20} />,
  'prog-balance': <Zap size={20} />,
  'prog-power': <Dumbbell size={20} />,
  'prog-detox': <Leaf size={20} />,
};

// The allergens shown as quick chips (everything else can be typed in).
const QUICK_ALLERGENS = [
  'lactose', 'eggs', 'gluten', 'fish', 'shrimp_crustaceans', 'peanuts', 'walnuts', 'sesame',
  'soy', 'mushrooms', 'tomatoes', 'chicken', 'beef', 'avocado', 'honey', 'strawberries_berries',
];

const PAY_LABEL: Record<PayId, 'payCash' | 'payCard' | 'payOnline'> = { cash: 'payCash', card: 'payCard', online: 'payOnline' };

export function OrderExperience() {
  const { locale: l, setLocale } = useLanguage();
  const { dishes, status: menuStatus } = useRationDishes(); // the live menu from the database
  const builderRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [portrait, setPortrait] = useState(false);

  // ── order state ──
  const [programId, setProgramId] = useState('prog-balance');
  const [calories, setCalories] = useState(1800);
  const [duration, setDuration] = useState(12);
  const [startKey, setStartKey] = useState('');
  const [slot, setSlot] = useState<SlotId>('e20');
  const [stopIds, setStopIds] = useState<string[]>([]);
  const [customStops, setCustomStops] = useState<string[]>([]);
  const [customDraft, setCustomDraft] = useState('');
  const [swaps, setSwaps] = useState<Record<string, string>>({}); // `${date}|${meal}` -> dishId
  const [menuDay, setMenuDay] = useState(0);
  const [swapFor, setSwapFor] = useState<{ key: string; dish: Dish; baseId: string } | null>(null);
  const [videoDish, setVideoDish] = useState<Dish | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [zoneId, setZoneId] = useState(batumiZones[0].id);
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [pay, setPay] = useState<PayId>('online');
  const [touched, setTouched] = useState<Set<number>>(new Set());
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | { id: string; total: number; awaitingLink?: boolean }>(null);

  const touch = useCallback((n: number) => setTouched(p => (p.has(n) ? p : new Set(p).add(n))), []);

  // ── setup on the client (dates + query string) ──
  const earliest = useMemo(() => {
    if (!mounted) return new Date();
    const now = new Date();
    return addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), now.getHours() >= 18 ? 2 : 1);
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    const q = new URLSearchParams(window.location.search).get('program');
    const found = programs.find(p => p.slug === q);
    if (found) {
      setProgramId(found.id);
      setCalories(CALORIE_OPTIONS[found.id][Math.min(1, CALORIE_OPTIONS[found.id].length - 1)].cal);
    }
    const mq = window.matchMedia('(max-width: 640px)');
    const on = () => setPortrait(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    if (mounted && !startKey) setStartKey(dayKey(earliest));
  }, [mounted, startKey, earliest]);

  // ── derived ──
  const program: Program = programs.find(p => p.id === programId) ?? programs[0];
  const accent = program.accentColor;
  const durCfg = DURATIONS.find(d => d.days === duration) ?? DURATIONS[2];
  const price = tierPrice(program.prices[durCfg.key] as number, program.id, calories);
  const zone = batumiZones.find(z => z.id === zoneId) ?? batumiZones[0];
  const total = price + zone.priceGEL;
  const trialPerDay = (program.prices.trialTwoDays as number) / 2;

  const startDate = useMemo(() => {
    if (!startKey) return earliest;
    const [y, m, d] = startKey.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [startKey, earliest]);

  const menuDates = useMemo(() => Array.from({ length: Math.min(duration, 7) }, (_, i) => addDays(startDate, i)), [startDate, duration]);
  const endDate = addDays(startDate, duration - 1);

  const stopNames = useMemo(
    () => [
      ...stopIds.map(id => ALLERGENS_DATABASE.find(a => a.id === id)?.name[l] ?? id),
      ...customStops,
    ],
    [stopIds, customStops, l]
  );

  /** names of stop-list items a dish contains */
  const conflicts = useCallback(
    (dish: Dish): string[] => {
      if (!stopIds.length && !customStops.length) return [];
      const text = [
        dish.name.ru, dish.name.en, dish.name.ka, ...dish.allergens,
        ...dish.ingredients.ru, ...dish.ingredients.en, ...dish.ingredients.ka,
      ].join(' ').toLowerCase();
      const hit: string[] = [];
      stopIds.forEach(id => {
        const a = ALLERGENS_DATABASE.find(x => x.id === id);
        if (!a) return;
        const words = [a.name.ru, a.name.en, a.name.ka, ...a.keywords.ru, ...a.keywords.en, ...a.keywords.ka];
        if (words.some(w => w && text.includes(w.toLowerCase()))) hit.push(a.name[l]);
      });
      customStops.forEach(c => c && text.includes(c.toLowerCase()) && hit.push(c));
      return hit;
    },
    [stopIds, customStops, l]
  );

  const effectiveMenu = useCallback(
    (date: Date): { key: string; baseId: string; dish: Dish; swapped: boolean }[] =>
      menuForDate(date, dishes).map(base => {
        const key = `${dayKey(date)}|${base.id}`;
        const picked = swaps[key] ? dishes.find(d => d.id === swaps[key]) : undefined;
        return { key, baseId: base.id, dish: picked ?? base, swapped: Boolean(picked) };
      }),
    [swaps, dishes]
  );

  const dayMenu = useMemo(() => effectiveMenu(menuDates[Math.min(menuDay, menuDates.length - 1)] ?? startDate), [effectiveMenu, menuDates, menuDay, startDate]);

  const swapCount = Object.keys(swaps).filter(k => menuDates.some(d => k.startsWith(dayKey(d)))).length;
  const flaggedTotal = useMemo(
    () => menuDates.reduce((n, d) => n + effectiveMenu(d).filter(m => conflicts(m.dish).length).length, 0),
    [menuDates, effectiveMenu, conflicts]
  );

  const phoneOk = phone.replace(/\D/g, '').length >= 9;
  const contactOk = name.trim().length > 1 && phoneOk && address.trim().length > 3;
  const progress = Math.round(((touched.size + (contactOk ? 1 : 0)) / 6) * 100);

  // ── handlers ──
  const pickProgram = (p: Program) => {
    setProgramId(p.id);
    const opts = CALORIE_OPTIONS[p.id];
    if (!opts.some(o => o.cal === calories)) setCalories(opts[Math.min(1, opts.length - 1)].cal);
    touch(1);
  };
  const toggleStop = (id: string) => {
    setStopIds(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
    touch(4);
  };
  const addCustom = () => {
    const v = customDraft.trim();
    if (v && !customStops.includes(v)) setCustomStops(p => [...p, v]);
    setCustomDraft('');
    touch(4);
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const submit = async () => {
    setTried(true);
    setError('');
    if (!contactOk) {
      setError(!phoneOk && phone ? T.badPhone[l] : T.fillRequired[l]);
      scrollTo('step-6');
      return;
    }
    setSending(true);
    const slotLabel = SLOTS.find(s => s.id === slot)!.time;
    const swapNotes = Object.entries(swaps).map(([k, dishId]) => {
      const [date, baseId] = k.split('|');
      const base = dishes.find(d => d.id === baseId);
      const dish = dishes.find(d => d.id === dishId);
      return `${date} ${base?.name.ru ?? baseId} → ${dish?.name.ru ?? dishId}`;
    });

    // The server stores the order, calculates the price, notifies the team and (for online payment) creates the card link.
    let res: { orderId: string; total: number; saved: boolean; notified: boolean; payUrl: string | null } | null = null;
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          zoneId: zone.id,
          programId: program.id,
          calories,
          days: duration,
          startDate: dayKey(startDate),
          slot: slotLabel,
          stopList: stopNames,
          swaps: swapNotes,
          comment: comment.trim(),
          payment: pay,
          language: l,
        }),
      });
      if (r.ok) res = await r.json();
    } catch { /* handled below */ }

    if (!res || (!res.saved && !res.notified)) {
      setSending(false);
      setError(l === 'ru' ? 'Не удалось отправить заказ. Проверьте интернет и попробуйте ещё раз.' : l === 'ka' ? 'შეკვეთა ვერ გაიგზავნა. სცადე ხელახლა.' : 'Could not send the order. Check your connection and try again.');
      return;
    }

    // Kitchen client card (what the kitchen tablet and couriers work from).
    const notes = [
      `🕗 ${slotLabel}`,
      stopNames.length ? `Стоп-лист: ${stopNames.join(', ')}` : '',
      swapNotes.length ? `Замены: ${swapNotes.join('; ')}` : '',
      comment.trim(),
    ].filter(Boolean).join(' | ');
    const client: KitchenClient = {
      id: res.orderId,
      clientName: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      zone: zone.name.ru,
      programId: program.id,
      programTitle: program.title.ru,
      calories,
      totalDays: duration,
      deliveredDays: 0,
      deliverySlot: 'evening',
      startDate: dayKey(startDate),
      status: 'active',
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };
    await kitchenDbService.upsertClient(client).catch(() => false);

    try {
      localStorage.setItem('fitfood_last_order', JSON.stringify({ ...client, total: res.total, pay }));
    } catch { /* storage may be unavailable */ }

    if (res.payUrl) {
      window.location.assign(res.payUrl); // off to the bank's card page
      return;
    }
    setSending(false);
    setDone({ id: res.orderId, total: res.total, awaitingLink: pay === 'online' });
    window.scrollTo({ top: 0 });
  };

  const style = { '--o-accent': accent } as React.CSSProperties;

  // ───────────────────────────── header ─────────────────────────────
  const header = (
    <header className="ord-header">
      <Link href="/" className="ord-brand" aria-label="FitFood">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-white.png" alt="FitFood" />
        <span className="ord-brand-tag">{T.brandTag[l]}</span>
      </Link>
      <div className="ord-head-right">
        <a href={CONTACT.phoneHref} className="ord-hcontact" aria-label={`${T.callUs[l]} ${CONTACT.phone}`}>
          <Phone size={16} /><span>{CONTACT.phone}</span>
        </a>
        <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="ord-hcontact icon" aria-label="Instagram">
          <InstagramIcon size={17} />
        </a>
        <Link href="/account" className="ord-hcontact icon" aria-label={T.account[l]} title={T.account[l]}><User size={17} /></Link>
        <div className="ord-lang" role="group" aria-label="Language">
          {LANGS.map(x => (
            <button key={x.code} type="button" aria-pressed={l === x.code} onClick={() => setLocale(x.code)}>{x.label}</button>
          ))}
        </div>
      </div>
    </header>
  );

  // ───────────────────────────── success ─────────────────────────────
  if (done) {
    return (
      <div className="ord-root" style={style}>
        {header}
        <div className="ord-done">
          <div className="ord-done-card">
            <div className="ord-done-ico"><Check size={42} strokeWidth={3} /></div>
            <h1>{T.doneTitle[l]}</h1>
            <p>{done.awaitingLink ? T.doneLink[l] : T.doneSub[l]}</p>
            <div className="ord-done-no">{T.orderNo[l]} {done.id}</div>
            <div className="ord-row"><span>{T.sProgram[l]}</span><b>{program.title[l]} · {calories} {T.kcal[l]}</b></div>
            <div className="ord-row"><span>{T.sPeriod[l]}</span><b>{fmtDate(startDate, l, { day: 'numeric', month: 'short' })} – {fmtDate(endDate, l, { day: 'numeric', month: 'short' })}</b></div>
            <div className="ord-row"><span>{T.sDelivery[l]}</span><b>{SLOTS.find(s => s.id === slot)?.time}</b></div>
            <div className="ord-row"><span>{T.total[l]}</span><b style={{ color: 'var(--o-lime)' }}>{done.total} GEL</b></div>
            <div className="ord-done-actions">
              <Link href="/account" className="ord-cta sec">{T.account[l]}</Link>
              <button type="button" className="ord-cta" onClick={() => { setDone(null); setTouched(new Set()); setTried(false); setSwaps({}); }}>{T.newOrder[l]}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stepHead = (n: number, title: string) => (
    <div className="ord-card-head">
      <span className={`ord-num ${touched.has(n) || (n === 6 && contactOk) ? 'done' : ''}`}>
        {touched.has(n) || (n === 6 && contactOk) ? <Check size={17} strokeWidth={3} /> : n}
      </span>
      <h2>{title}</h2>
    </div>
  );

  const calOpts = CALORIE_OPTIONS[program.id];

  return (
    <div className="ord-root" style={style}>
      {header}

      {/* ───────── hero ───────── */}
      <section className="ord-hero">
        {mounted && (
          <video
            key={portrait ? 'v' : 'h'}
            className="ord-hero-video"
            autoPlay muted loop playsInline preload="auto"
            src={portrait ? '/video/vertical.mp4' : '/video/horizontal.mp4'}
          />
        )}
        <div className="ord-hero-inner">
          <span className="ord-kicker"><i />{T.heroKicker[l]}</span>
          <h1>{T.heroTitle1[l]} <em>{T.heroTitle2[l]}</em> {T.heroTitle3[l]}</h1>
          <p>{T.heroSub[l]}</p>
          <button type="button" className="ord-cta" onClick={() => scrollTo('builder')}>
            {T.heroCta[l]} <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ───────── builder ───────── */}
      <div className="ord-builder" id="builder" ref={builderRef}>
        <div className="ord-steps">
          <div className="ord-progress" aria-hidden><i style={{ width: `${progress}%` }} /></div>

          {/* 1 — program */}
          <section className="ord-card" id="step-1">
            {stepHead(1, T.s1[l])}
            <div className="ord-programs">
              {programs.map(p => {
                const min = tierPrice(Math.min(...DURATIONS.map(d => (p.prices[d.key] as number) / d.days)), p.id, CALORIE_OPTIONS[p.id][0].cal);
                return (
                  <button
                    key={p.id} type="button" className="ord-prog"
                    style={{ '--c': p.accentColor } as React.CSSProperties}
                    aria-pressed={p.id === programId} onClick={() => pickProgram(p)}
                  >
                    {p.popular && <span className="ord-badge">{T.popular[l]}</span>}
                    <div className="ord-prog-ico">{PROGRAM_ICON[p.id]}</div>
                    <h3>{p.title[l].split(' (')[0]}</h3>
                    <small>{(p.title[l].match(/\((.*)\)/) || [])[1] || ''}</small>
                    <div className="ord-prog-foot">
                      <span>{p.mealsPerDay} {T.mealsDay[l]}</span>
                      <span>{T.from[l]} <b>{Math.round(min)}</b> GEL/{T.perDay[l]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2 — calories & duration */}
          <section className="ord-card" id="step-2">
            {stepHead(2, T.s2[l])}
            <div className="ord-chips">
              {calOpts.map(o => (
                <button key={o.cal} type="button" className="ord-chip" aria-pressed={o.cal === calories} onClick={() => { setCalories(o.cal); touch(2); }}>
                  {o.cal} {T.kcal[l]}
                  <small>{o.meals} {T.mealsDay[l]}</small>
                </button>
              ))}
            </div>
            <div className="ord-durs">
              {DURATIONS.map(d => {
                const full = tierPrice(program.prices[d.key] as number, program.id, calories);
                const saving = Math.round((1 - (program.prices[d.key] as number) / d.days / trialPerDay) * 100);
                return (
                  <button key={d.days} type="button" className="ord-dur" aria-pressed={d.days === duration} onClick={() => { setDuration(d.days); setMenuDay(0); touch(2); }}>
                    {saving > 0 && <span className="save">-{saving}%</span>}
                    <b>{d.days}</b>
                    <span>{d.days === 2 ? T.trial[l] : T.days[l]}</span>
                    <em>{full} GEL</em>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3 — start & delivery */}
          <section className="ord-card" id="step-3">
            {stepHead(3, T.s4[l])}
            <div className="ord-start">
              <div>
                <span className="ord-label">{T.startDate[l]}</span>
                {mounted && (
                  <Calendar locale={l} value={startDate} min={earliest} days={duration}
                    onChange={d => { setStartKey(dayKey(d)); setMenuDay(0); touch(3); }} />
                )}
              </div>
              <div>
                <span className="ord-label">{T.slot[l]}</span>
                <div className="ord-slots">
                  {SLOTS.map(sl => (
                    <button key={sl.id} type="button" className="ord-slot" aria-pressed={sl.id === slot} onClick={() => { setSlot(sl.id); touch(3); }}>
                      <Clock size={15} /> {sl.time}
                    </button>
                  ))}
                </div>
                <p className="ord-note">{T.startHint[l]}</p>
              </div>
            </div>
          </section>

          {/* 5 — allergies */}
          <section className="ord-card" id="step-4">
            {stepHead(4, T.s5[l])}
            <p className="ord-hint">{T.stopHint[l]}</p>
            <div className="ord-chips">
              <button type="button" className="ord-chip sm" aria-pressed={!stopIds.length && !customStops.length} onClick={() => { setStopIds([]); setCustomStops([]); touch(4); }}>
                <Check size={14} /> {T.noneStop[l]}
              </button>
              {QUICK_ALLERGENS.map(id => {
                const a = ALLERGENS_DATABASE.find(x => x.id === id);
                if (!a) return null;
                return (
                  <button key={id} type="button" className="ord-chip sm danger" aria-pressed={stopIds.includes(id)} onClick={() => toggleStop(id)}>
                    {a.name[l]}
                  </button>
                );
              })}
              {customStops.map(c => (
                <button key={c} type="button" className="ord-chip sm danger" aria-pressed onClick={() => setCustomStops(p => p.filter(x => x !== c))}>
                  {c} <X size={13} />
                </button>
              ))}
            </div>
            <div className="ord-custom">
              <input
                className="ord-input" value={customDraft} placeholder={T.customStop[l]}
                onChange={e => setCustomDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                aria-label={T.customStop[l]}
              />
              <button type="button" className="ord-btn-ghost" onClick={addCustom}><Plus size={16} /></button>
            </div>
          </section>

          {/* 6 — menu preview */}
          <section className="ord-card" id="step-5">
            {stepHead(5, T.s6[l])}
            <p className="ord-hint">{T.menuHint[l]}</p>
            {menuStatus === 'loading' && <p className="ord-note">{T.loadingMenu[l]}</p>}
            {menuStatus === 'error' && <div className="ord-error" role="alert">{T.menuError[l]}</div>}
            {mounted && menuStatus === 'ready' && (
              <>
                <div className="ord-menu-days">
                  {menuDates.map((d, i) => (
                    <button key={dayKey(d)} type="button" className="ord-mday" aria-pressed={i === menuDay} onClick={() => { setMenuDay(i); touch(4); }}>
                      <small>{fmtDate(d, l, { weekday: 'short' })}</small>
                      <b>{fmtDate(d, l, { day: 'numeric', month: 'short' })}</b>
                    </button>
                  ))}
                </div>
                {flaggedTotal > 0 && (
                  <div className="ord-warn" style={{ margin: '8px 0' }}>
                    <AlertTriangle size={15} /> {flaggedTotal} × {T.conflict[l].toLowerCase()} {stopNames.join(', ')}
                  </div>
                )}
                {dayMenu.length === 0 && <p className="ord-note">{T.menuEmpty[l]}</p>}
                <div className="ord-meals">
                  {dayMenu.map(({ key, baseId, dish, swapped }, i) => {
                    const bad = conflicts(dish);
                    return (
                      <article key={key + dish.id} className={`ord-meal ${bad.length ? 'warn' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="ord-meal-img">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={dish.image} alt={dish.name[l]} loading="lazy" />
                          {dish.rationOnly && <span className="ord-meal-only">{T.rationOnly[l]}</span>}
                          {videoSrc(dish.slug, false) && (
                            <button type="button" className="ord-meal-play" onClick={() => setVideoDish(dish)} aria-label={`${T.watch[l]}: ${dish.name[l]}`}>
                              <Play size={14} /> {T.watch[l]}
                            </button>
                          )}
                        </div>
                        <div className="ord-meal-body">
                          <span className="ord-meal-kind">{T.mealName[dish.mealType]?.[l] ?? dish.mealType}</span>
                          <h4>{dish.name[l]}</h4>
                          <div className="ord-macros">
                            <span>{dish.macros.calories} {T.kcal[l]}</span>
                            <span>{T.protein[l]} {dish.macros.protein}</span>
                            <span>{T.fat[l]} {dish.macros.fat}</span>
                            <span>{T.carbs[l]} {dish.macros.carbs}</span>
                          </div>
                          <div className="ord-ing">{dish.ingredients[l].slice(0, 5).map(plainIngredient).join(' · ')}</div>
                          {bad.length > 0 && <div className="ord-warn"><AlertTriangle size={14} /> {T.conflict[l]}: {bad.join(', ')}</div>}
                          <button type="button" className={`ord-swap ${swapped ? 'on' : ''}`} onClick={() => { setSwapFor({ key, dish, baseId }); touch(4); }}>
                            <Repeat size={15} /> {swapped ? T.swapped[l] : T.swap[l]}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {/* 7 — contacts */}
          <section className="ord-card" id="step-6">
            {stepHead(6, T.s7[l])}
            <div className="ord-form-grid">
              <div className="ord-field">
                <label htmlFor="o-name">{T.name[l]}</label>
                <input id="o-name" className={`ord-input ${tried && name.trim().length < 2 ? 'bad' : ''}`} value={name} autoComplete="name" onChange={e => setName(e.target.value)} />
              </div>
              <div className="ord-field">
                <label htmlFor="o-phone">{T.phone[l]}</label>
                <input id="o-phone" className={`ord-input ${tried && !phoneOk ? 'bad' : ''}`} type="tel" inputMode="tel" autoComplete="tel" placeholder="+995 5XX XX XX XX" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="ord-field full">
                <label htmlFor="o-zone">{T.zone[l]}</label>
                <div style={{ position: 'relative' }}>
                  <select id="o-zone" className="ord-input" style={{ appearance: 'none', paddingRight: 40 }} value={zoneId} onChange={e => setZoneId(e.target.value)}>
                    {batumiZones.map(z => (
                      <option key={z.id} value={z.id}>{z.name[l]} — {z.priceGEL === 0 ? T.free[l] : `+${z.priceGEL} GEL`}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} style={{ position: 'absolute', right: 14, top: 15, pointerEvents: 'none', color: '#94a3b8' }} />
                </div>
              </div>
              <div className="ord-field full">
                <label htmlFor="o-addr"><MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />{T.address[l]}</label>
                <input id="o-addr" className={`ord-input ${tried && address.trim().length <= 3 ? 'bad' : ''}`} autoComplete="street-address" placeholder={T.addressPh[l]} value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div className="ord-field full">
                <label htmlFor="o-com">{T.comment[l]}</label>
                <input id="o-com" className="ord-input" value={comment} onChange={e => setComment(e.target.value)} />
              </div>
              <div className="ord-field full">
                <label>{T.payment[l]}</label>
                <div className="ord-pays">
                  {(['online', 'card', 'cash'] as PayId[]).map(p => (
                    <button key={p} type="button" className="ord-pay" aria-pressed={pay === p} onClick={() => setPay(p)}>
                      <span><b>{T[PAY_LABEL[p]][l]}</b>{p === 'online' && <small>{T.payOnlineSub[l]}</small>}</span>
                      {pay === p && <Check size={18} color="#ccff00" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ───────── summary ───────── */}
        <aside className="ord-summary" aria-label={T.summary[l]}>
          <h3>{T.summary[l]}</h3>
          <div className="ord-sum-hero" style={{ '--c': accent } as React.CSSProperties}>
            <div className="ord-prog-ico" style={{ '--c': accent } as React.CSSProperties}>{PROGRAM_ICON[program.id]}</div>
            <div>
              <b>{program.title[l]}</b>
              <small>{calories} {T.kcal[l]} · {duration} {T.days[l]}</small>
            </div>
          </div>
          {mounted && (
            <div className="ord-row"><span>{T.sPeriod[l]}</span><b>{fmtDate(startDate, l, { day: 'numeric', month: 'short' })} – {fmtDate(endDate, l, { day: 'numeric', month: 'short' })}</b></div>
          )}
          <div className="ord-row"><span>{T.sDelivery[l]}</span><b>{SLOTS.find(s => s.id === slot)?.time}</b></div>
          {stopNames.length > 0 && <div className="ord-row"><span>{T.sStop[l]}</span><b>{stopNames.length}</b></div>}
          {swapCount > 0 && <div className="ord-row"><span>{T.sSwaps[l]}</span><b>{swapCount}</b></div>}
          <div className="ord-row"><span>{T.sPrice[l]}</span><b>{price} GEL</b></div>
          <div className="ord-row"><span><Truck size={13} style={{ display: 'inline', marginRight: 4 }} />{T.sDelivery[l]}</span><b>{zone.priceGEL === 0 ? T.free[l] : `${zone.priceGEL} GEL`}</b></div>
          <div className="ord-total"><span>{T.total[l]}</span><b>{total}<small>GEL</small></b></div>
          {error && <div className="ord-error" role="alert">{error}</div>}
          <button type="button" className="ord-submit" onClick={submit} disabled={sending}>
            {sending ? T.sending[l] : <>{T.submit[l]} <ArrowRight size={19} /></>}
          </button>
          <div className="ord-secure"><ShieldCheck size={14} /> {T.secure[l]}</div>
        </aside>
      </div>

      {/* mobile bottom bar */}
      <div className="ord-bar">
        <div><small>{T.total[l]}</small><b>{total} GEL</b></div>
        <button type="button" className="ord-cta" onClick={() => (contactOk ? submit() : scrollTo('step-6'))} disabled={sending}>
          {contactOk ? T.submit[l] : T.toOrder[l]} <ArrowRight size={17} />
        </button>
      </div>

      <SignatureFilms locale={l} dishes={dishes} onOrder={() => scrollTo('builder')} />

      {/* contacts */}
      <section className="ord-contacts" aria-label={T.contactsTitle[l]}>
        <h2>{T.contactsTitle[l]}</h2>
        <div className="ord-contacts-row">
          <a className="ord-ccard" href={CONTACT.phoneHref}><Phone size={20} /><span><small>{T.callUs[l]}</small><b>{CONTACT.phone}</b></span></a>
          <a className="ord-ccard" href={CONTACT.instagram} target="_blank" rel="noopener noreferrer"><InstagramIcon size={20} /><span><small>Instagram</small><b>{CONTACT.instagramHandle}</b></span></a>
        </div>
      </section>

      {videoDish && <DishVideoModal dish={videoDish} locale={l} onClose={() => setVideoDish(null)} />}

      {swapFor && (
        <SwapSheet
          locale={l}
          current={swapFor.dish}
          pool={dishes}
          conflicts={conflicts}
          onClose={() => setSwapFor(null)}
          onPick={d => {
            setSwaps(p => {
              const next = { ...p };
              if (d.id === swapFor.baseId) delete next[swapFor.key];
              else next[swapFor.key] = d.id;
              return next;
            });
            setSwapFor(null);
          }}
        />
      )}
    </div>
  );
}
