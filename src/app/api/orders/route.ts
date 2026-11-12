import { NextRequest, NextResponse } from 'next/server';
import { programs } from '@/data/programs';
import { batumiZones } from '@/data/batumiZones';
import { DURATIONS, GYMS, LEAD_DAYS, SLOTS, addDays, batumiToday, dayKey, rationPrice } from '@/components/order/orderData';
import { zoneForPoint } from '@/data/batumiZones';
import { enabledOptions, mealsFor } from '@/lib/rationOptions';
import { formatRationOrderNotification, sendTelegramMessage } from '@/lib/telegram';
import { getServiceSupabase, normalizePhone } from '@/lib/serverSupabase';
import { newOrderId, newPayCode, startOnlinePayment } from '@/lib/orderServer';
import { onlinePaymentsConfigured } from '@/lib/payments/payze';

const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);
const PAY_RU: Record<string, string> = { online: 'Онлайн (карта)', transfer: 'Перевод на счёт', gym: 'Наличными в зале' };

/** GET tells the order page which payment methods work right now. */
export async function GET() {
  return NextResponse.json({ online: onlinePaymentsConfigured() });
}

export async function POST(req: NextRequest) {
  let b: any;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  // Validate everything. The price is calculated HERE, never taken from the browser.
  const program = programs.find(p => p.id === b.programId);
  const dur = DURATIONS.find(d => d.days === Number(b.days));
  const calories = Number(b.calories);
  // the delivery zone (and its fee) comes from the pin on the map, never from the browser
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  const zone = Number.isFinite(lat) && Number.isFinite(lng) ? zoneForPoint(lat, lng) : null;
  const slot = SLOTS.find(s => s.time === b.slot);
  const phoneDigits = normalizePhone(b.phone);
  const name = clip(b.customerName, 80);
  const address = clip(b.address, 200);
  const startDate = clip(b.startDate, 10);
  const payment = ['online', 'transfer', 'gym'].includes(b.payment) ? (b.payment as string) : 'online';
  const gym = payment === 'gym' ? GYMS.find(g => g.id === b.gymId) : undefined;

  if (!program || !dur || !zone || !slot || !enabledOptions(program.id).some(o => o.cal === calories)) {
    return NextResponse.json({ error: 'bad_order' }, { status: 400 });
  }
  if (payment === 'gym' && !gym) return NextResponse.json({ error: 'bad_gym' }, { status: 400 });
  // the first delivery is never sooner than the day after tomorrow (Batumi time)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || startDate < dayKey(addDays(batumiToday(), LEAD_DAYS))) {
    return NextResponse.json({ error: 'bad_date' }, { status: 400 });
  }
  if (name.length < 2 || address.length < 4 || !phoneDigits || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return NextResponse.json({ error: 'bad_contact' }, { status: 400 });
  }

  const subtotal = rationPrice(mealsFor(program.id, calories), calories, dur.days);
  const deliveryFee = zone.priceGEL * dur.days; // a paid zone is charged on every day of the ration
  const total = subtotal + deliveryFee;
  const stopList: string[] = Array.isArray(b.stopList) ? b.stopList.slice(0, 40).map((x: unknown) => clip(x, 60)) : [];
  const swaps: string[] = Array.isArray(b.swaps) ? b.swaps.slice(0, 60).map((x: unknown) => clip(x, 160)) : [];
  const comment = clip(b.comment, 300);
  const commentFull = [comment, zone ? `📍 https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}` : ''].filter(Boolean).join(' | ');
  const language = ['ka', 'ru', 'en'].includes(b.language) ? b.language : 'ru';

  // Store the order.
  const db = getServiceSupabase();
  let orderId = newOrderId();
  const payCode = payment === 'gym' ? newPayCode() : null; // the customer tells this code at the gym
  let saved = false;
  if (db) {
    const row = {
      id: orderId,
      phone_digits: phoneDigits,
      customer_name: name,
      phone: clip(b.phone, 30),
      address,
      zone: zone.name.ru,
      program_id: program.id,
      program_title: program.title.ru,
      calories,
      days: dur.days,
      start_date: startDate,
      delivery_slot: slot.time,
      stop_list: stopList,
      swaps,
      comment: commentFull || null,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      payment_method: payment,
      payment_status: 'unpaid',
      payment_code: payCode,
      pay_point_id: gym?.id ?? null,
      language,
    };
    let { error } = await db.from('site_orders').insert(row);
    if (error && /duplicate/i.test(error.message)) {
      orderId = newOrderId();
      ({ error } = await db.from('site_orders').insert({ ...row, id: orderId }));
    }
    saved = !error;
    if (error) console.error('site_orders insert failed:', error.message);
  }

  // Tell the team.
  const tg = await sendTelegramMessage(
    formatRationOrderNotification({
      orderId,
      customerName: name,
      phone: clip(b.phone, 30),
      program: program.title.ru,
      calories,
      days: dur.days,
      startDate,
      slot: slot.time,
      zone: zone.name.ru,
      address,
      payment: PAY_RU[payment] + (gym ? ` — ${gym.name}` : ''),
      payCode: payCode ?? undefined,
      total,
      stopList,
      swaps,
      comment: commentFull,
      language,
    })
  ).catch(() => ({ success: false }));

  // Online payment.
  let payUrl: string | null = null;
  let payError: string | null = null;
  if (payment === 'online' && db && saved) {
    const r = await startOnlinePayment(db, { id: orderId, total, language });
    if (r && 'url' in r) payUrl = r.url;
    else if (r && 'error' in r) payError = r.error;
  }

  return NextResponse.json({ orderId, total, subtotal, deliveryFee, saved, notified: Boolean((tg as any)?.success), payUrl, payError, payCode });
}
