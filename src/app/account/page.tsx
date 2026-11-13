'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, LogOut, Phone } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { normalizePhone } from '@/lib/phone';
import { useRationDishes } from '@/lib/rationDishesService';
import { buildMenu } from '@/lib/rationRotation';
import { parseMacroGoal } from '@/lib/calorieCalc';
import { mealsFor } from '@/lib/rationOptions';
import { Locale } from '@/types';
import { DishImage } from '@/components/order/DishImage';
import { CONTACT, addDays, dayKey, fmtDate } from '@/components/order/orderData';
import '@/components/order/order.css';

type Str = Record<Locale, string>;
const s = (ka: string, ru: string, en: string): Str => ({ ka, ru, en });

const A = {
  title: s('პირადი კაბინეტი', 'Личный кабинет', 'My account'),
  loginSub: s('შეიყვანე ტელეფონი — გამოგიგზავნით SMS კოდს.', 'Введите телефон — пришлём SMS-код.', 'Enter your phone — we will text you a code.'),
  phone: s('ტელეფონი', 'Телефон', 'Phone'),
  sendCode: s('კოდის გაგზავნა', 'Получить код', 'Send code'),
  code: s('SMS კოდი', 'Код из SMS', 'SMS code'),
  confirm: s('შესვლა', 'Войти', 'Sign in'),
  codeSent: s('კოდი გაიგზავნა ნომერზე', 'Код отправлен на', 'Code sent to'),
  change: s('ნომრის შეცვლა', 'Другой номер', 'Change number'),
  badPhone: s('შეამოწმე ტელეფონის ნომერი', 'Проверьте номер телефона', 'Check the phone number'),
  badCode: s('არასწორი კოდი', 'Неверный код', 'Wrong code'),
  sendFail: s('SMS ვერ გაიგზავნა. სცადე მოგვიანებით ან დაგვირეკე.', 'Не удалось отправить SMS. Попробуйте позже или позвоните нам.', 'Could not send the SMS. Try again later or call us.'),
  logout: s('გასვლა', 'Выйти', 'Sign out'),
  demoBanner: s('დემო რეჟიმი: ტესტური მონაცემები, რეალური შეკვეთები არ არის.', 'Демо-режим: тестовые данные, это не настоящие заказы.', 'Demo mode: sample data, not real orders.'),
  demoPay: s('დემოში გადახდა არ სრულდება.', 'В демо-режиме оплата не выполняется.', 'Payments are not made in demo mode.'),
  orders: s('ჩემი შეკვეთები', 'Мои заказы', 'My orders'),
  none: s('შეკვეთები ჯერ არ არის.', 'Заказов пока нет.', 'No orders yet.'),
  newOrder: s('შეკვეთა', 'Сделать заказ', 'Place an order'),
  period: s('პერიოდი', 'Период', 'Period'),
  delivery: s('მიტანა', 'Доставка', 'Delivery'),
  total: s('სულ', 'Итого', 'Total'),
  pay: s('გადახდა', 'Оплатить', 'Pay now'),
  upcoming: s('უახლოესი მენიუ', 'Ближайшее меню', 'Upcoming menu'),
  paidOk: s('გადახდა მიღებულია. მადლობა!', 'Оплата получена. Спасибо!', 'Payment received. Thank you!'),
  payFailed: s('გადახდა ვერ შესრულდა. სცადე ხელახლა.', 'Оплата не прошла. Попробуйте ещё раз.', 'The payment did not go through. Try again.'),
  payUnavailable: s('ონლაინ გადახდა ჯერ არ არის ჩართული — მენეჯერი გამოგიგზავნით ბმულს.', 'Онлайн-оплата пока не подключена — менеджер пришлёт ссылку.', 'Online payment is not enabled yet — a manager will send you a link.'),
  noDb: s('სერვისი დროებით მიუწვდომელია.', 'Сервис временно недоступен.', 'Service temporarily unavailable.'),
  loading: s('იტვირთება…', 'Загрузка…', 'Loading…'),
  back: s('შეკვეთაზე', 'К заказу', 'To ordering'),
  method: {
    online: s('ონლაინ ბარათით', 'Онлайн картой', 'Online by card'),
    transfer: s('გადარიცხვა ანგარიშზე', 'Перевод на счёт', 'Bank transfer'),
    gym: s('ნაღდი ფული დარბაზში', 'Наличными в зале', 'Cash at the gym'),
  } as Record<string, Str>,
  payCode: s('გადახდის კოდი', 'Код оплаты', 'Payment code'),
  payStatus: {
    unpaid: s('გადასახდელია', 'Ожидает оплаты', 'Awaiting payment'),
    pending: s('გადახდის მოლოდინში', 'Ожидает оплаты', 'Awaiting payment'),
    paid: s('გადახდილია', 'Оплачен', 'Paid'),
    failed: s('გადახდა ვერ შესრულდა', 'Оплата не прошла', 'Payment failed'),
  } as Record<string, Str>,
  status: {
    new: s('ახალი', 'Новый', 'New'),
    confirmed: s('დადასტურებულია', 'Подтверждён', 'Confirmed'),
    active: s('აქტიური', 'Активен', 'Active'),
    completed: s('დასრულებულია', 'Завершён', 'Completed'),
    cancelled: s('გაუქმებულია', 'Отменён', 'Cancelled'),
  } as Record<string, Str>,
  meal: {
    breakfast: s('საუზმე', 'Завтрак', 'Breakfast'),
    snack: s('სამხარი', 'Перекус', 'Snack'),
    lunch: s('სადილი', 'Обед', 'Lunch'),
    dinner: s('ვახშამი', 'Ужин', 'Dinner'),
    dessert: s('დესერტი', 'Десерт', 'Dessert'),
    smoothie: s('სმუზი', 'Смузи', 'Smoothie'),
  } as Record<string, Str>,
};

interface OrderRow {
  id: string;
  program_id: string;
  program_title: string;
  calories: number;
  days: number;
  start_date: string;
  delivery_slot: string;
  total: number;
  payment_method: string;
  payment_code: string | null;
  payment_status: string;
  status: string;
  address: string;
  comment?: string | null;
  created_at: string;
}

/** Preview login: this number + code opens a demo account with sample orders. No SMS, no real session, no real data. */
const DEMO_PHONE = '995579205205';
const DEMO_CODE = '1222';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function demoOrders(): OrderRow[] {
  const day = (n: number) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
  return [
    {
      id: 'FF-DEMO-2', program_id: 'prog-slim', program_title: 'Снижение веса', calories: 1800, days: 14, start_date: iso(day(1)),
      delivery_slot: '20:00 – 21:00', total: 927, payment_method: 'online', payment_code: null, payment_status: 'unpaid', status: 'confirmed',
      address: 'Батуми, ул. Руставели', created_at: new Date().toISOString(),
    },
    {
      id: 'FF-DEMO-1', program_id: 'prog-balance', program_title: 'Баланс', calories: 1500, days: 7, start_date: iso(day(-12)),
      delivery_slot: '21:00 – 22:00', total: 426, payment_method: 'gym', payment_code: 'K7M2QX', payment_status: 'paid', status: 'completed',
      address: 'Батуми, ул. Руставели', created_at: new Date(Date.now() - 14 * 864e5).toISOString(),
    },
  ];
}

export default function AccountPage() {
  const { locale: l, setLocale } = useLanguage();
  const { dishes } = useRationDishes();

  const [token, setToken] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState('');
  const [ready, setReady] = useState(false);
  const [phone, setPhone] = useState('+995 ');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [banner, setBanner] = useState<'paid' | 'fail' | ''>('');
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('paid')) setBanner('paid');
    else if (q.get('payfail')) setBanner('fail');

    if (!isSupabaseConfigured) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
      setUserPhone(data.session?.user?.phone ?? '');
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setToken(session?.access_token ?? null);
      setUserPhone(session?.user?.phone ?? '');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase.from('site_orders').select('*').order('created_at', { ascending: false });
    setOrders(error ? [] : (data as OrderRow[]));
  }, []);

  useEffect(() => {
    if (token) loadOrders();
    else setOrders(null);
  }, [token, loadOrders]);

  const digits = normalizePhone(phone);

  const sendCode = async () => {
    setMsg('');
    if (!digits) { setMsg(A.badPhone[l]); return; }
    if (digits === DEMO_PHONE) { setStep('code'); return; } // demo number: nothing is sent
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: `+${digits}` });
    setBusy(false);
    if (error) { setMsg(A.sendFail[l]); return; }
    setStep('code');
  };

  const verify = async () => {
    setMsg('');
    if (digits === DEMO_PHONE) {
      if (code.trim() === DEMO_CODE) { setDemo(true); setOrders(demoOrders()); } else setMsg(A.badCode[l]);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone: `+${digits}`, token: code.trim(), type: 'sms' });
    setBusy(false);
    if (error) setMsg(A.badCode[l]);
  };

  const logout = async () => {
    if (demo) { setDemo(false); setOrders(null); setStep('phone'); setCode(''); return; }
    await supabase.auth.signOut();
    setStep('phone');
    setCode('');
  };

  const pay = async (orderId: string) => {
    setMsg('');
    if (demo) { setMsg(A.demoPay[l]); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) { window.location.assign(j.url); return; }
      setMsg(r.status === 503 ? A.payUnavailable[l] : A.payFailed[l]);
    } catch {
      setMsg(A.payFailed[l]);
    }
    setBusy(false);
  };

  // next days of the most recent active order
  const upcoming = useMemo(() => {
    const o = (orders || []).find(x => x.status !== 'cancelled' && x.status !== 'completed');
    if (!o || !dishes.length) return [];
    const start = new Date(o.start_date + 'T00:00:00');
    const end = addDays(start, o.days - 1);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const from = start > today ? start : today;
    const n = mealsFor(o.program_id, o.calories);
    const out: { date: Date; meals: ReturnType<typeof buildMenu> }[] = [];
    for (let d = new Date(from); d <= end && out.length < 5; d = addDays(d, 1)) out.push({ date: new Date(d), meals: buildMenu(d, n, dishes, o.calories, parseMacroGoal(o.comment), start) });
    return out;
  }, [orders, dishes]);

  const LANGS: Locale[] = ['ka', 'ru', 'en'];

  return (
    <div className="ord-root">
      <header className="ord-header">
        <Link href="/" className="ord-brand" aria-label="FitFood">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-white.png" alt="FitFood" />
        </Link>
        <div className="ord-head-right">
          <a href={CONTACT.phoneHref} className="ord-hcontact icon" aria-label={CONTACT.phone}><Phone size={16} /></a>
          <Link href="/" className="ord-back"><ArrowLeft size={16} /><span>{A.back[l]}</span></Link>
          <div className="ord-lang" role="group" aria-label="Language">
            {LANGS.map(c => (
              <button key={c} type="button" aria-pressed={l === c} onClick={() => setLocale(c)}>{c.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="acc-main">
        <h1 className="acc-title">{A.title[l]}</h1>

        {banner === 'paid' && <div className="acc-banner ok">{A.paidOk[l]}</div>}
        {banner === 'fail' && <div className="ord-error">{A.payFailed[l]}</div>}
        {!isSupabaseConfigured && <div className="ord-error">{A.noDb[l]}</div>}

        {!ready ? (
          <p className="ord-note">{A.loading[l]}</p>
        ) : !token && !demo ? (
          <section className="ord-card acc-login">
            {step === 'phone' ? (
              <>
                <p className="ord-hint" style={{ margin: '0 0 14px' }}>{A.loginSub[l]}</p>
                <label className="acc-label" htmlFor="acc-phone">{A.phone[l]}</label>
                <input id="acc-phone" className="ord-input" type="tel" inputMode="tel" autoComplete="tel" value={phone}
                  onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendCode()} />
                <button type="button" className="ord-submit" style={{ marginTop: 14 }} onClick={sendCode} disabled={busy}>{A.sendCode[l]}</button>
              </>
            ) : (
              <>
                <p className="ord-hint" style={{ margin: '0 0 14px' }}>{A.codeSent[l]} +{digits}</p>
                <label className="acc-label" htmlFor="acc-code">{A.code[l]}</label>
                <input id="acc-code" className="ord-input" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={e => e.key === 'Enter' && verify()} />
                <button type="button" className="ord-submit" style={{ marginTop: 14 }} onClick={verify} disabled={busy || code.length < 4}>{A.confirm[l]}</button>
                <button type="button" className="ord-btn-ghost" style={{ marginTop: 10, width: '100%' }} onClick={() => { setStep('phone'); setCode(''); setMsg(''); }}>{A.change[l]}</button>
              </>
            )}
            {msg && <div className="ord-error" style={{ marginTop: 12 }} role="alert">{msg}</div>}
          </section>
        ) : (
          <>
            <div className="acc-bar">
              <span>+{demo ? DEMO_PHONE : userPhone}</span>
              <button type="button" className="ord-btn-ghost" onClick={logout}><LogOut size={15} style={{ marginRight: 6, verticalAlign: -2 }} />{A.logout[l]}</button>
            </div>
            {demo && <div className="acc-banner ok">{A.demoBanner[l]}</div>}
            {msg && <div className="ord-error" role="alert">{msg}</div>}

            <h2 className="acc-h2">{A.orders[l]}</h2>
            {orders === null ? (
              <p className="ord-note">{A.loading[l]}</p>
            ) : orders.length === 0 ? (
              <section className="ord-card">
                <p className="ord-hint" style={{ margin: '0 0 14px' }}>{A.none[l]}</p>
                <Link href="/" className="ord-cta" style={{ textDecoration: 'none' }}>{A.newOrder[l]}</Link>
              </section>
            ) : (
              <div className="acc-orders">
                {orders.map(o => {
                  const start = new Date(o.start_date + 'T00:00:00');
                  const needsPay = o.payment_method === 'online' && o.payment_status !== 'paid' && o.status !== 'cancelled';
                  return (
                    <article key={o.id} className="ord-card acc-order">
                      <div className="acc-order-head">
                        <b>{o.id}</b>
                        <span className={`acc-pill ${o.payment_status}`}>{A.payStatus[o.payment_status]?.[l] ?? o.payment_status}</span>
                        <span className="acc-pill">{A.status[o.status]?.[l] ?? o.status}</span>
                      </div>
                      <div className="ord-row"><span>{o.program_title}</span><b>{o.calories} · {o.days}</b></div>
                      <div className="ord-row"><span>{A.period[l]}</span><b>{fmtDate(start, l, { day: 'numeric', month: 'short' })} – {fmtDate(addDays(start, o.days - 1), l, { day: 'numeric', month: 'short' })}</b></div>
                      <div className="ord-row"><span>{A.delivery[l]}</span><b>{o.delivery_slot}</b></div>
                      <div className="ord-row"><span>{A.method[o.payment_method]?.[l] ?? o.payment_method}</span><b>{o.payment_code && o.payment_status !== 'paid' ? `${A.payCode[l]}: ${o.payment_code.slice(0, 3)}-${o.payment_code.slice(3)}` : ''}</b></div>
                      <div className="ord-row"><span>{A.total[l]}</span><b style={{ color: 'var(--o-lime)' }}>{o.total} GEL</b></div>
                      {needsPay && (
                        <button type="button" className="ord-submit" style={{ marginTop: 14 }} onClick={() => pay(o.id)} disabled={busy}>
                          <CreditCard size={18} /> {A.pay[l]} · {o.total} GEL
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {upcoming.length > 0 && (
              <>
                <h2 className="acc-h2">{A.upcoming[l]}</h2>
                <div className="acc-days">
                  {upcoming.map(({ date, meals }) => (
                    <section key={dayKey(date)} className="ord-card acc-day">
                      <h3>{fmtDate(date, l, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                      {meals.length === 0 ? <p className="ord-note">—</p> : meals.map(({ slot, dish: m }) => (
                        <div key={`${slot}-${m.id}`} className="acc-meal">
                          <DishImage src={m.image} alt={m.name[l]} />
                          <div>
                            <small>{A.meal[m.mealType]?.[l] ?? m.mealType}</small>
                            <b>{m.name[l]}</b>
                            <span>{m.macros.calories} · {m.macros.protein}/{m.macros.fat}/{m.macros.carbs}</span>
                          </div>
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
