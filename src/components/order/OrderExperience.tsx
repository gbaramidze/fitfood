'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, Clock, Dumbbell, Flame, Leaf,
  Repeat, ShieldCheck, Zap, Sparkles, MapPin, Truck, Phone, Play, User,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Dish, Locale, Program } from '@/types';
import { programs } from '@/data/programs';
import { Goal, allowedLevels, calcCalories, nearestLevel } from '@/lib/calorieCalc';
import { ClientProfile, DEFAULT_PROFILE, clearProfile, loadProfile, saveProfile } from '@/lib/clientProfile';
import { zoneForPoint } from '@/data/batumiZones';
import { ALLERGENS_DATABASE } from '@/data/allergensList';
import { buildMenu, isViable } from '@/lib/rationRotation';
import { CALORIE_LEVELS, mealsFor } from '@/lib/rationOptions';
import { useRationDishes, videoSrc } from '@/lib/rationDishesService';
import { kitchenDbService } from '@/services/kitchenDbService';
import { KitchenClient } from '@/types/kitchen';
import {
  CONTACT, DURATIONS, GYMS, SLOTS, TRANSFER, PayId, SlotId, T, LEAD_DAYS, addDays, batumiToday, dayKey, fmtDate, mealsWord, rationPrice,
} from './orderData';
import { SwapSheet } from './SwapSheet';
import { DishVideoModal } from './DishVideoModal';
import { DishImage } from './DishImage';
import { RationQuiz } from './RationQuiz';
import { DeliveryMap } from './DeliveryMap';
import { PayIcons } from './PayIcons';
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

const PAY_LABEL: Record<PayId, 'payOnline' | 'payTransfer' | 'payGym'> = { online: 'payOnline', transfer: 'payTransfer', gym: 'payGym' };
const PAY_SUB: Record<PayId, 'payOnlineSub' | 'payTransferSub' | 'payGymSub'> = { online: 'payOnlineSub', transfer: 'payTransferSub', gym: 'payGymSub' };

const LAST_STEP = 4;

export function OrderExperience() {
  const { locale: l, setLocale } = useLanguage();
  const { dishes, status: menuStatus } = useRationDishes(); // the live menu from the database

  const [mounted, setMounted] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [step, setStep] = useState(1);

  // ── order state ──
  // the quiz: who the ration is for (kept on this device)
  const [profile, setProfile] = useState<ClientProfile>(DEFAULT_PROFILE);
  const [profileSet, setProfileSet] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const autoPicked = useRef(false);
  const goal: Goal = profile.goal;
  const [calories, setCalories] = useState(1800);
  const [duration, setDuration] = useState(14);
  const [startKey, setStartKey] = useState('');
  const [slot, setSlot] = useState<SlotId>('e20');
  const [swaps, setSwaps] = useState<Record<string, string>>({}); // `${date}|${slot}|${baseDishId}` -> replacement dishId
  const [menuDay, setMenuDay] = useState(0);
  const [swapFor, setSwapFor] = useState<{ key: string; dish: Dish; baseId: string } | null>(null);
  const [videoDish, setVideoDish] = useState<Dish | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null); // the pin on the delivery map
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [pay, setPay] = useState<PayId>('online');
  const [gymId, setGymId] = useState(GYMS[0].id);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | { id: string; total: number; awaitingLink?: boolean; payCode?: string; gym?: string; transfer?: boolean }>(null);

  // ── setup on the client (dates + query string) ──
  const earliest = useMemo(() => {
    return addDays(batumiToday(), LEAD_DAYS); // always the day after tomorrow, whatever the hour
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    const q = new URLSearchParams(window.location.search).get('program');
    const saved = loadProfile();
    const fromSlug: Record<string, Goal> = { slim: 'lose', balance: 'maintain', power: 'gain' };
    const base = saved ?? DEFAULT_PROFILE;
    setProfile(q && fromSlug[q] ? { ...base, goal: fromSlug[q] } : base);
    setProfileSet(Boolean(saved));
    const mq = window.matchMedia('(max-width: 640px)');
    const on = () => setPortrait(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    if (mounted && !startKey) setStartKey(dayKey(earliest));
  }, [mounted, startKey, earliest]);

  // ── what can really be served ──
  // A ration is offered only if it is enabled AND the database has a dish for every meal of every day.
  const menuReady = menuStatus === 'ready';
  const okLevels = useMemo(
    () => (menuReady ? CALORIE_LEVELS.filter(o => o.enabled !== false && isViable(o.meals, o.cal, dishes)) : []),
    [menuReady, dishes]
  );
  const canOrder = okLevels.length > 0;

  // the goal decides which program the order is filed under (kitchen and admin still group by program)
  const GOAL_PROGRAM: Record<Goal, string> = { lose: 'prog-slim', maintain: 'prog-balance', gain: 'prog-power' };
  const program: Program = programs.find(p => p.id === GOAL_PROGRAM[goal]) ?? programs[0];
  const meals = mealsFor(program.id, calories);

  // ── quiz result ──
  const calc = useMemo(() => (profileSet ? calcCalories(profile) : null), [profileSet, profile]);
  // nobody is offered a ration far below what they need
  const allowedNow = useMemo(() => (calc ? allowedLevels(okLevels, calc.target, profile.sex) : okLevels), [calc, okLevels, profile.sex]);
  const recommended = calc ? nearestLevel(allowedNow, calc.target) : undefined;

  // saved details: preselect the closest ration once (after that the customer decides)
  useEffect(() => {
    if (recommended && !autoPicked.current) {
      autoPicked.current = true;
      setCalories(recommended.cal);
    }
  }, [recommended]);

  /** forget the saved details: the quiz starts from scratch next time */
  const resetQuiz = () => {
    clearProfile();
    setProfile(DEFAULT_PROFILE);
    setProfileSet(false);
  };

  const applyQuiz = (p: ClientProfile, cal: number) => {
    autoPicked.current = true;
    setProfile(p);
    setProfileSet(true);
    saveProfile(p);
    setCalories(cal);
    setQuizOpen(false);
  };

  // keep the selection on something that can be served
  useEffect(() => {
    if (menuReady && okLevels.length && !okLevels.some(o => o.cal === calories)) {
      setCalories((nearestLevel(okLevels, calories) ?? okLevels[0]).cal);
    }
  }, [menuReady, okLevels, calories]);

  const accent = program.accentColor;
  const price = rationPrice(meals, calories, duration);
  const zone = coords ? zoneForPoint(coords.lat, coords.lng) : null; // zone and fee come from the pin
  const zoneFee = zone?.priceGEL ?? 0; // GEL per delivery day
  const deliveryTotal = zoneFee * duration; // a paid zone is charged on every day of the ration
  const total = price + deliveryTotal;
  const perDayOf = (m: number, kcal: number, days: number) => Math.round(rationPrice(m, kcal, days) / days);

  const startDate = useMemo(() => {
    if (!startKey) return earliest;
    const [y, m, d] = startKey.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [startKey, earliest]);

  const startOptions = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(earliest, i)), [earliest]);
  const menuDates = useMemo(() => Array.from({ length: Math.min(duration, 7) }, (_, i) => addDays(startDate, i)), [startDate, duration]);
  const endDate = addDays(startDate, duration - 1);

  /** Allergens a dish contains (shown on the dish — the customer swaps it if it does not suit). */
  const allergenCache = useRef(new Map<string, string[]>());
  const allergensOf = useCallback(
    (dish: Dish): string[] => {
      const key = `${dish.id}|${l}|${dish.allergens.join(',')}|${dish.ingredients.ka.length}`;
      const cached = allergenCache.current.get(key);
      if (cached) return cached;
      const text = [
        dish.name.ru, dish.name.en, dish.name.ka, ...dish.allergens,
        ...dish.ingredients.ru, ...dish.ingredients.en, ...dish.ingredients.ka,
      ].join(' ').toLowerCase();
      const hit = ALLERGENS_DATABASE
        .filter(a => a.isCommonAllergen && [...a.keywords.ru, ...a.keywords.en, ...a.keywords.ka].some(w => w && text.includes(w.toLowerCase())))
        .map(a => a.name[l].split(/\s+(?:и|and|და|&)\s+|\s*\(/)[0].trim()); // "Лактоза и коровье молоко" -> "Лактоза"
      allergenCache.current.set(key, hit);
      return hit;
    },
    [l]
  );

  const effectiveMenu = useCallback(
    (date: Date): { key: string; baseId: string; dish: Dish; swapped: boolean }[] =>
      buildMenu(date, meals, dishes, calories).map(({ slot: sl, dish: base }) => {
        const key = `${dayKey(date)}|${sl}|${base.id}`;
        const picked = swaps[key] ? dishes.find(d => d.id === swaps[key]) : undefined;
        return { key, baseId: base.id, dish: picked ?? base, swapped: Boolean(picked) };
      }),
    [swaps, dishes, meals, calories]
  );

  const dayMenu = useMemo(
    () => effectiveMenu(menuDates[Math.min(menuDay, menuDates.length - 1)] ?? startDate),
    [effectiveMenu, menuDates, menuDay, startDate]
  );

  // Real portions from the database: the day's totals are simply the sum of its dishes.
  const dayTotals = useMemo(
    () =>
      dayMenu.reduce(
        (a, m) => ({
          kcal: a.kcal + m.dish.macros.calories,
          p: a.p + m.dish.macros.protein,
          f: a.f + m.dish.macros.fat,
          c: a.c + m.dish.macros.carbs,
        }),
        { kcal: 0, p: 0, f: 0, c: 0 }
      ),
    [dayMenu]
  );
  const diffPct = calories > 0 ? Math.round(((dayTotals.kcal - calories) / calories) * 100) : 0;

  const swapCount = Object.keys(swaps).filter(k => menuDates.some(d => k.startsWith(dayKey(d)))).length;
  const phoneOk = phone.replace(/\D/g, '').length >= 9;
  const contactOk = name.trim().length > 1 && phoneOk && address.trim().length > 3 && Boolean(zone);

  // ── handlers ──
  const goTo = (n: number) => {
    setStep(n);
    document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submit = async () => {
    setTried(true);
    setError('');
    if (!contactOk) {
      setError(!coords ? T.pickOnMap[l] : !zone ? T.outOfZone[l] : !phoneOk && phone ? T.badPhone[l] : T.fillRequired[l]);
      setStep(LAST_STEP);
      return;
    }
    setSending(true);
    const slotLabel = SLOTS.find(s => s.id === slot)!.time;
    const swapNotes = Object.entries(swaps).map(([k, dishId]) => {
      const [date, , baseId] = k.split('|');
      const base = dishes.find(d => d.id === baseId);
      const dish = dishes.find(d => d.id === dishId);
      return `${date} ${base?.name.ru ?? baseId} → ${dish?.name.ru ?? dishId}`;
    });

    // The server stores the order, calculates the price, notifies the team and (for online payment) creates the card link.
    let res: { orderId: string; total: number; saved: boolean; notified: boolean; payUrl: string | null; payCode?: string | null } | null = null;
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          lat: coords?.lat,
          lng: coords?.lng,
          programId: program.id,
          calories,
          days: duration,
          startDate: dayKey(startDate),
          slot: slotLabel,
          stopList: [],
          swaps: swapNotes,
          comment: comment.trim(),
          payment: pay,
          gymId: pay === 'gym' ? gymId : undefined,
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
      swapNotes.length ? `Замены: ${swapNotes.join('; ')}` : '',
      comment.trim(),
    ].filter(Boolean).join(' | ');
    const client: KitchenClient = {
      id: res.orderId,
      clientName: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      zone: zone?.name.ru ?? '',
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
    setDone({
      id: res.orderId,
      total: res.total,
      awaitingLink: pay === 'online',
      payCode: res.payCode || undefined,
      gym: pay === 'gym' ? GYMS.find(g => g.id === gymId)?.name : undefined,
      transfer: pay === 'transfer',
    });
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
            {done.payCode && (
              <div className="ord-code">
                <small>{T.payCode[l]} · {done.gym}</small>
                <strong>{done.payCode.slice(0, 3)}-{done.payCode.slice(3)}</strong>
                <p>{T.codeHelp[l].replace('{amount}', String(done.total))}</p>
              </div>
            )}
            {done.transfer && (
              <div className="ord-code">
                <small>{T.payTransfer[l]}</small>
                {TRANSFER.iban ? (
                  <>
                    <strong style={{ fontSize: 17, letterSpacing: '.02em' }}>{TRANSFER.iban}</strong>
                    <p>{T.bank[l]}: {TRANSFER.bank} · {T.recipient[l]}: {TRANSFER.recipient}</p>
                  </>
                ) : (
                  <p>{T.transferLater[l]}</p>
                )}
                <p>{T.transferHelp[l]} <b>{done.id}</b> · {done.total} GEL</p>
              </div>
            )}
            <div className="ord-row"><span>{T.sProgram[l]}</span><b>{program.title[l].split(' (')[0]} · {calories} {T.kcal[l]}</b></div>
            <div className="ord-row"><span>{T.sPeriod[l]}</span><b>{fmtDate(startDate, l, { day: 'numeric', month: 'short' })} – {fmtDate(endDate, l, { day: 'numeric', month: 'short' })}</b></div>
            <div className="ord-row"><span>{T.sDelivery[l]}</span><b>{SLOTS.find(s => s.id === slot)?.time}</b></div>
            <div className="ord-row"><span>{T.total[l]}</span><b style={{ color: 'var(--o-lime)' }}>{done.total} GEL</b></div>
            <div className="ord-done-actions">
              <Link href="/account" className="ord-cta sec">{T.account[l]}</Link>
              <button type="button" className="ord-cta" onClick={() => { setDone(null); setStep(1); setTried(false); setSwaps({}); }}>{T.newOrder[l]}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stepTitles = [T.stepRation[l], T.s4[l], T.s6[l], T.s7[l]];

  const nav = (
    <div className="ord-nav">
      {step > 1 ? (
        <button type="button" className="ord-btn-ghost" onClick={() => goTo(step - 1)}><ArrowLeft size={16} /> {T.prev[l]}</button>
      ) : <span />}
      {step < LAST_STEP && (
        <button type="button" className="ord-cta" onClick={() => goTo(step + 1)} disabled={!canOrder}>{T.next[l]} <ArrowRight size={17} /></button>
      )}
    </div>
  );

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
          <button type="button" className="ord-cta" onClick={() => goTo(1)}>
            {T.heroCta[l]} <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ───────── builder (one step at a time) ───────── */}
      <div className="ord-builder" id="builder">
        <div className="ord-steps">
          <div className="ord-stepper" role="tablist" aria-label={T.heroCta[l]}>
            {stepTitles.map((t, i) => (
              <button
                key={i} type="button" role="tab" aria-selected={step === i + 1}
                className={`ord-stab${step === i + 1 ? ' on' : ''}${step > i + 1 ? ' past' : ''}`}
                onClick={() => setStep(i + 1)}
              >
                <span className="ord-num">{step > i + 1 ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
                <span className="ord-stab-t">{t}</span>
              </button>
            ))}
          </div>

          <section className="ord-card ord-step">
            {/* 1 — program, calories, duration */}
            {step === 1 && (
              <>
                {menuStatus === 'loading' && <p className="ord-note">{T.loadingMenu[l]}</p>}
                {menuStatus === 'error' && <div className="ord-error" role="alert">{T.menuError[l]}</div>}
                {menuReady && !canOrder && (
                  <div className="ord-error" role="status">
                    {T.noRations[l]} <a href={CONTACT.phoneHref} style={{ color: 'inherit', fontWeight: 800 }}>{CONTACT.phone}</a>
                  </div>
                )}
                {menuReady && (
                  <div className="q-entry">
                    {profileSet && calc ? (
                      <>
                        <div className="q-entry-info">
                          <b>{T[profile.sex][l]} · {profile.age} {T.yrs[l]} · {profile.heightCm} {T.cm[l]} · {profile.weightKg} {T.kg[l]}</b>
                          <small>{T.calcResult[l].replace('{need}', String(calc.maintain)).replace('{target}', String(calc.target))}</small>
                        </div>
                        <div className="q-entry-actions">
                          <button type="button" className="ord-btn-ghost" onClick={() => setQuizOpen(true)}>{T.quizEdit[l]}</button>
                          <button type="button" className="ord-btn-ghost" onClick={resetQuiz}>{T.quizReset[l]}</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="q-entry-info">
                          <b>{T.quizTitle[l]}</b>
                          <small>{T.quizSub[l]}</small>
                        </div>
                        <button type="button" className="ord-cta" onClick={() => setQuizOpen(true)}><Sparkles size={17} /> {T.quizBtn[l]}</button>
                      </>
                    )}
                  </div>
                )}

                {canOrder && (
                  <>
                    <span className="ord-label">{T.pickCal[l]}</span>
                    <div className="ord-levels">
                      {CALORIE_LEVELS.map(o => {
                        const st: 'ok' | 'menu' | 'soon' = o.enabled === false ? 'soon' : isViable(o.meals, o.cal, dishes) ? 'ok' : 'menu';
                        const low = st === 'ok' && !allowedNow.some(a => a.cal === o.cal);
                        const delta = calc && st === 'ok' && !low ? o.cal - calc.maintain : null;
                        return (
                          <button
                            key={o.cal} type="button" className={`ord-chip${st !== 'ok' || low ? ' off' : ''}`}
                            disabled={st !== 'ok' || low} aria-pressed={st === 'ok' && !low && o.cal === calories} onClick={() => setCalories(o.cal)}
                          >
                            {st === 'ok' && !low && recommended?.cal === o.cal && <span className="ord-rec">{T.recommended[l]}</span>}
                            <span className="lv-kcal">{o.cal} <em>{T.kcal[l]}</em></span>
                            {st === 'ok' && !low ? (
                              <>
                                <small>{o.meals} {mealsWord(o.meals, l)}</small>
                                <b className="lv-price">{perDayOf(o.meals, o.cal, 30)} GEL/{T.perDay[l]}</b>
                              </>
                            ) : (
                              <small>{low ? T.tooLow[l] : st === 'soon' ? T.soon[l] : T.inWork[l]}</small>
                            )}
                            {delta !== null && <small className="lv-delta">{delta > 0 ? '+' : ''}{delta} {T.kcal[l]} {T.vsNeed[l]}</small>}
                          </button>
                        );
                      })}
                    </div>

                    <span className="ord-label">{T.s3[l]}</span>
                    <div className="ord-durs">
                      {DURATIONS.map(d => {
                        const full = rationPrice(meals, calories, d.days);
                        const trialDay = rationPrice(meals, calories, 2) / 2;
                        const saving = Math.round((1 - full / d.days / trialDay) * 100);
                        return (
                          <button key={d.days} type="button" className="ord-dur" aria-pressed={d.days === duration} onClick={() => { setDuration(d.days); setMenuDay(0); }}>
                            {saving > 0 && <span className="save">-{saving}%</span>}
                            <b>{d.days}</b>
                            <span>{d.days === 2 ? T.trial[l] : T.days[l]}</span>
                            <em>{full} GEL</em>
                            <small>{Math.round(full / d.days)}/{T.perDay[l]}</small>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* 2 — start date & delivery time */}
            {step === 2 && (
              <div className="ord-start">
                <div>
                  <label className="ord-label" htmlFor="o-start">{T.startDate[l]}</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="o-start" className="ord-input" style={{ appearance: 'none', paddingRight: 40 }}
                      value={startKey} onChange={e => { setStartKey(e.target.value); setMenuDay(0); }}
                    >
                      {startOptions.map(d => (
                        <option key={dayKey(d)} value={dayKey(d)}>{fmtDate(d, l, { weekday: 'long', day: 'numeric', month: 'long' })}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} style={{ position: 'absolute', right: 14, top: 14, pointerEvents: 'none', color: '#94a3b8' }} />
                  </div>
                  {mounted && (
                    <p className="ord-note">
                      {fmtDate(startDate, l, { day: 'numeric', month: 'long' })} – {fmtDate(endDate, l, { day: 'numeric', month: 'long' })} · {duration} {T.days[l]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="ord-label" htmlFor="o-slot">{T.slot[l]}</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="o-slot" className="ord-input" style={{ appearance: 'none', paddingRight: 40 }}
                      value={slot} onChange={e => setSlot(e.target.value as SlotId)}
                    >
                      {SLOTS.map(sl => <option key={sl.id} value={sl.id}>{sl.time}</option>)}
                    </select>
                    <ChevronDown size={18} style={{ position: 'absolute', right: 14, top: 14, pointerEvents: 'none', color: '#94a3b8' }} />
                  </div>
                </div>
                <p className="ord-note" style={{ gridColumn: '1 / -1' }}>{T.startHint[l]}</p>
              </div>
            )}

            {/* 3 — the week's menu with day totals */}
            {step === 3 && (
              <>
                <p className="ord-hint">{T.menuHint[l]}</p>
                {menuStatus === 'loading' && <p className="ord-note">{T.loadingMenu[l]}</p>}
                {menuStatus === 'error' && <div className="ord-error" role="alert">{T.menuError[l]}</div>}
                {mounted && menuReady && (
                  <>
                    <div className="ord-menu-days">
                      {menuDates.map((d, i) => (
                        <button key={dayKey(d)} type="button" className="ord-mday" aria-pressed={i === menuDay} onClick={() => setMenuDay(i)}>
                          <small>{fmtDate(d, l, { weekday: 'short' })}</small>
                          <b>{fmtDate(d, l, { day: 'numeric', month: 'short' })}</b>
                        </button>
                      ))}
                    </div>
                    {dayMenu.length === 0 && <p className="ord-note">{T.menuEmpty[l]}</p>}
                    <div className="ord-meals">
                      {dayMenu.map(({ key, baseId, dish, swapped }, i) => {
                        const has = allergensOf(dish);
                        return (
                          <article key={key + dish.id} className="ord-meal" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="ord-meal-img">
                              <DishImage src={dish.image} alt={dish.name[l]} />
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
                                {dish.macros.weightGrams > 0 && <span>{dish.macros.weightGrams} {T.grams[l]}</span>}
                              </div>
                              <div className="ord-ing">{dish.ingredients[l].slice(0, 5).map(plainIngredient).join(' · ')}</div>
                              {has.length > 0 && <div className="ord-contains">{T.contains[l]}: {has.join(', ')}</div>}
                              <button type="button" className={`ord-swap ${swapped ? 'on' : ''}`} onClick={() => setSwapFor({ key, dish, baseId })}>
                                <Repeat size={15} /> {swapped ? T.swapped[l] : T.swap[l]}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <div className="ord-daytotal">
                      <div className="ord-daytotal-head">
                        <b>{T.dayTotal[l]}</b>
                        <span>{meals} {mealsWord(meals, l)}</span>
                      </div>
                      <div className="ord-daytotal-grid">
                        <div><strong>{dayTotals.kcal}</strong><small>{T.kcal[l]}</small></div>
                        <div><strong>{Math.round(dayTotals.p)}</strong><small>{T.protein[l]}</small></div>
                        <div><strong>{Math.round(dayTotals.f)}</strong><small>{T.fat[l]}</small></div>
                        <div><strong>{Math.round(dayTotals.c)}</strong><small>{T.carbs[l]}</small></div>
                      </div>
                      <p>
                        {T.dayMenuNote[l]
                          .replace('{kcal}', String(calories))
                          .replace('{sum}', String(dayTotals.kcal))
                          .replace('{diff}', `${diffPct > 0 ? '+' : ''}${diffPct}%`)}
                      </p>
                      {Math.abs(diffPct) > 15 && <p className="ord-warn" style={{ marginTop: 6 }}><AlertTriangle size={14} /> {T.dayMenuOff[l]}</p>}
                    </div>
                  </>
                )}
              </>
            )}

            {/* 4 — contacts & payment */}
            {step === 4 && (
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
                  <label>{T.deliveryPoint[l]}</label>
                  <DeliveryMap
                    locale={l}
                    value={coords}
                    address={address}
                    onPick={({ lat, lng, address: found }) => {
                      setCoords({ lat, lng });
                      if (found) setAddress(found);
                    }}
                  />
                  {tried && !coords && <p className="ord-warn" style={{ marginTop: 8 }}><AlertTriangle size={14} /> {T.pickOnMap[l]}</p>}
                  {coords && zone && (
                    <p className="ord-zone">
                      <Truck size={14} /> {zone.name[l]} — <b>{zoneFee === 0 ? T.free[l] : `+${zoneFee} GEL/${T.perDay[l]} × ${duration} = ${deliveryTotal} GEL`}</b>
                    </p>
                  )}
                  {coords && !zone && <p className="ord-warn" style={{ marginTop: 8 }}><AlertTriangle size={14} /> {T.outOfZone[l]} <a href={CONTACT.phoneHref} style={{ color: 'inherit', fontWeight: 800 }}>{CONTACT.phone}</a></p>}
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
                    {(['online', 'transfer', 'gym'] as PayId[]).map(p => (
                      <button key={p} type="button" className="ord-pay" aria-pressed={pay === p} onClick={() => setPay(p)}>
                        <span><b>{T[PAY_LABEL[p]][l]}</b><small>{T[PAY_SUB[p]][l]}</small>{p === 'online' && <PayIcons />}</span>
                        {pay === p && <Check size={18} color="#ccff00" />}
                      </button>
                    ))}
                  </div>
                  {pay === 'gym' && (
                    <>
                      <span className="ord-label">{T.gymChoose[l]}</span>
                      <div className="ord-gyms">
                        {GYMS.map(g => (
                          <button key={g.id} type="button" className="ord-pay" aria-pressed={gymId === g.id} onClick={() => setGymId(g.id)}>
                            <span><b>{g.name}</b><small>{g.address[l]}</small></span>
                            {gymId === g.id && <Check size={18} color="#ccff00" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {nav}
          </section>
        </div>

        {/* ───────── summary ───────── */}
        <aside className="ord-summary" aria-label={T.summary[l]}>
          <h3>{T.summary[l]}</h3>
          <div className="ord-sum-hero" style={{ '--c': accent } as React.CSSProperties}>
            <div className="ord-prog-ico" style={{ '--c': accent } as React.CSSProperties}>{PROGRAM_ICON[program.id]}</div>
            <div>
              <b>{program.title[l].split(' (')[0]}</b>
              <small>{calories} {T.kcal[l]} · {meals} {mealsWord(meals, l)} · {duration} {T.days[l]}</small>
            </div>
          </div>
          {mounted && (
            <div className="ord-row"><span>{T.sPeriod[l]}</span><b>{fmtDate(startDate, l, { day: 'numeric', month: 'short' })} – {fmtDate(endDate, l, { day: 'numeric', month: 'short' })}</b></div>
          )}
          <div className="ord-row"><span>{T.sDelivery[l]}</span><b>{SLOTS.find(s => s.id === slot)?.time}</b></div>
          {swapCount > 0 && <div className="ord-row"><span>{T.sSwaps[l]}</span><b>{swapCount}</b></div>}
          <div className="ord-row"><span>{T.sPrice[l]}</span><b>{price} GEL</b></div>
          <div className="ord-row"><span><Truck size={13} style={{ display: 'inline', marginRight: 4 }} />{T.sDelivery[l]}</span><b>{!zone ? '—' : zoneFee === 0 ? T.free[l] : `${deliveryTotal} GEL`}</b></div>
          <div className="ord-total"><span>{T.total[l]}</span><b>{total}<small>GEL</small></b></div>
          {error && <div className="ord-error" role="alert">{error}</div>}
          <button type="button" className="ord-submit" onClick={submit} disabled={sending || !canOrder}>
            {sending ? T.sending[l] : <>{T.submit[l]} <ArrowRight size={19} /></>}
          </button>
          <div className="ord-secure"><ShieldCheck size={14} /> {T.secure[l]}</div>
        </aside>
      </div>

      {/* mobile bottom bar */}
      <div className="ord-bar">
        <div><small>{T.total[l]}</small><b>{total} GEL</b></div>
        <button
          type="button" className="ord-cta" disabled={sending || !canOrder}
          onClick={() => (step < LAST_STEP ? goTo(step + 1) : submit())}
        >
          {step < LAST_STEP ? T.next[l] : T.submit[l]} <ArrowRight size={17} />
        </button>
      </div>

      {/* contacts */}
      <section className="ord-contacts" aria-label={T.contactsTitle[l]}>
        <h2>{T.contactsTitle[l]}</h2>
        <div className="ord-contacts-row">
          <a className="ord-ccard" href={CONTACT.phoneHref}><Phone size={20} /><span><small>{T.callUs[l]}</small><b>{CONTACT.phone}</b></span></a>
          <a className="ord-ccard" href={CONTACT.instagram} target="_blank" rel="noopener noreferrer"><InstagramIcon size={20} /><span><small>Instagram</small><b>{CONTACT.instagramHandle}</b></span></a>
        </div>
      </section>

      {quizOpen && <RationQuiz locale={l} initial={profileSet ? profile : null} levels={okLevels} onClose={() => setQuizOpen(false)} onApply={applyQuiz} />}

      {videoDish && <DishVideoModal dish={videoDish} locale={l} onClose={() => setVideoDish(null)} />}

      {swapFor && (
        <SwapSheet
          locale={l}
          current={swapFor.dish}
          pool={dishes}
          allergensOf={allergensOf}
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
