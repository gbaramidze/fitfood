import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/serverSupabase';
import { onlinePaymentsConfigured, readBody, readStatus, signatureValid, siteOrderId } from '@/lib/payments/flitt';
import { sendTelegramMessage } from '@/lib/telegram';

/**
 * Flitt calls this when a card payment finishes (server_callback_url).
 * Nothing is trusted until the SHA-1 signature (made with our payment key) checks out, and the merchant,
 * currency and amount must match the stored order.
 */
export async function POST(req: NextRequest) {
  if (!onlinePaymentsConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const body = await readBody(req);
  if (!signatureValid(body) || String(body.merchant_id) !== String(process.env.FLITT_MERCHANT_ID)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const orderId = siteOrderId(String(body.order_id || ''));
  if (!orderId) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const db = getServiceSupabase();
  if (!db) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const { data: order } = await db
    .from('site_orders')
    .select('payment_status,payment_log,customer_name,total')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { paid, failed, status } = readStatus(body);
  const amountOk = Number(body.amount) === Math.round(Number(order.total) * 100) && String(body.currency) === 'GEL';
  const log = [...(Array.isArray(order.payment_log) ? order.payment_log : []), { at: new Date().toISOString(), status, amountOk, body }].slice(-20);

  const wasPaid = order.payment_status === 'paid';
  let next = order.payment_status;
  if (paid && amountOk) next = 'paid';
  else if (!wasPaid && failed) next = 'failed'; // a declined retry never un-pays an order that already went through
  else if (paid && !amountOk) next = wasPaid ? 'paid' : 'unpaid'; // wrong amount — keep it for a human to look at

  const update: Record<string, unknown> = { payment_status: next, payment_log: log };
  if (next === 'paid' && !wasPaid) {
    Object.assign(update, { status: 'confirmed', paid_at: new Date().toISOString(), paid_amount: Number(body.amount) / 100, payment_ref: String(body.payment_id ?? '') || null });
  }
  await db.from('site_orders').update(update).eq('id', orderId);

  if (next === 'paid' && !wasPaid) {
    await sendTelegramMessage(`💳 <b>Оплачено онлайн</b> ${orderId} — ${order.customer_name}, <b>${order.total} GEL</b>`).catch(() => {});
  } else if (paid && !amountOk) {
    await sendTelegramMessage(`⚠️ Flitt: сумма платежа не совпала с заказом ${orderId} (получено ${Number(body.amount) / 100}, ожидалось ${order.total}). Проверьте вручную.`).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
