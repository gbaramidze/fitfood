import { NextRequest, NextResponse } from 'next/server';
import { programs } from '@/data/programs';
import { batumiZones } from '@/data/batumiZones';
import { CALORIE_OPTIONS, DURATIONS, SLOTS, tierPrice } from '@/components/order/orderData';
import { formatRationOrderNotification, sendTelegramMessage } from '@/lib/telegram';
import { getServiceSupabase, normalizePhone } from '@/lib/serverSupabase';
import { newOrderId, startOnlinePayment } from '@/lib/orderServer';
import { onlinePaymentsConfigured } from '@/lib/payments/payze';

const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);
const PAY_RU: Record<string, string> = { cash: 'Наличными курьеру', card: 'Картой курьеру', online: 'Онлайн (карта)' };

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
  const zone = batumiZones.find(z => z.id === b.zoneId);
  const slot = SLOTS.find(s => s.time === b.slot);
  const phoneDigits = normalizePhone(b.phone);
  const name = clip(b.customerName, 80);
  const address = clip(b.address, 200);
  const startDate = clip(b.startDate, 10);
  const payment = ['cash', 'card', 'online'].includes(b.payment) ? (b.payment as string) : 'cash';

  if (!program || !dur || !zone || !slot || !(CALORIE_OPTIONS[program.id] || []).some(o => o.cal === calories)) {
    return NextResponse.json({ error: 'bad_order' }, { status: 400 });
  }
  if (name.length < 2 || address.length < 4 || !phoneDigits || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return NextResponse.json({ error: 'bad_contact' }, { status: 400 });
  }

  const subtotal = tierPrice(program.prices[dur.key] as number, program.id, calories);
  const deliveryFee = zone.priceGEL;
  const total = subtotal + deliveryFee;
  const stopList: string[] = Array.isArray(b.stopList) ? b.stopList.slice(0, 40).map((x: unknown) => clip(x, 60)) : [];
  const swaps: string[] = Array.isArray(b.swaps) ? b.swaps.slice(0, 60).map((x: unknown) => clip(x, 160)) : [];
  const comment = clip(b.comment, 300);
  const language = ['ka', 'ru', 'en'].includes(b.language) ? b.language : 'ru';

  // Store the order.
  const db = getServiceSupabase();
  let orderId = newOrderId();
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
      comment: comment || null,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      payment_method: payment,
      payment_status: 'unpaid',
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
      payment: PAY_RU[payment],
      total,
      stopList,
      swaps,
      comment,
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

  return NextResponse.json({ orderId, total, subtotal, deliveryFee, saved, notified: Boolean((tg as any)?.success), payUrl, payError });
}
