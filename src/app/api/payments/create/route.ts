import { NextRequest, NextResponse } from 'next/server';
import { getAnonSupabase, getServiceSupabase } from '@/lib/serverSupabase';
import { startOnlinePayment } from '@/lib/orderServer';

/** A signed-in customer asks for a (new) card-payment link for one of their unpaid orders. */
export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const { orderId } = await req.json().catch(() => ({}));
  if (!token || !orderId) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const { data: auth } = await getAnonSupabase().auth.getUser(token);
  const phone = auth?.user?.phone;
  if (!phone) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const db = getServiceSupabase();
  if (!db) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const { data: order } = await db
    .from('site_orders')
    .select('id,total,language,payment_status,phone_digits')
    .eq('id', orderId)
    .maybeSingle();
  if (!order || order.phone_digits !== phone) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (order.payment_status === 'paid') return NextResponse.json({ error: 'already_paid' }, { status: 409 });

  const r = await startOnlinePayment(db, order);
  if (!r) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if ('error' in r) return NextResponse.json({ error: 'provider_error', detail: r.error }, { status: 502 });
  return NextResponse.json({ url: r.url });
}
