import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/serverSupabase';
import { readWebhook, tokenValid } from '@/lib/payments/payze';
import { sendTelegramMessage } from '@/lib/telegram';

/** The payment provider calls this when a card payment finishes. The URL carries an HMAC token we generated, so strangers cannot call it. */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get('order') || '';
  if (!orderId || !tokenValid(orderId, url.searchParams.get('t') || '')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const db = getServiceSupabase();
  if (!db) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const { paid, failed, status } = readWebhook(body);

  const { data: order } = await db
    .from('site_orders')
    .select('payment_status,payment_log,customer_name,total')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const log = [...(Array.isArray(order.payment_log) ? order.payment_log : []), { at: new Date().toISOString(), status, body }].slice(-20);
  const next = paid ? 'paid' : failed ? 'failed' : order.payment_status;
  await db
    .from('site_orders')
    .update({ payment_status: next, payment_log: log, ...(paid ? { status: 'confirmed' } : {}) })
    .eq('id', orderId);

  if (paid && order.payment_status !== 'paid') {
    await sendTelegramMessage(`💳 <b>Оплачено онлайн</b> ${orderId} — ${order.customer_name}, <b>${order.total} GEL</b>`).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
