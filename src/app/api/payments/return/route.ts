import { NextRequest, NextResponse } from 'next/server';
import { readBody, readStatus, signatureValid, siteOrderId } from '@/lib/payments/flitt';

/**
 * Flitt sends the customer's browser back here (response_url) with a POST. We only choose which banner to show on
 * /account — the order itself is marked paid by the signed server callback in ./webhook, never from here.
 */
const siteOrigin = (req: NextRequest) => (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, '');

async function back(req: NextRequest, body: Record<string, unknown>) {
  const orderId = siteOrderId(String(body.order_id || ''));
  const verified = signatureValid(body);
  const { paid } = readStatus(body);
  const q = !orderId || !verified ? '' : paid ? `?paid=${encodeURIComponent(orderId)}` : `?payfail=${encodeURIComponent(orderId)}`;
  return NextResponse.redirect(new URL(`/account${q}`, siteOrigin(req)), 303);
}

export async function POST(req: NextRequest) {
  return back(req, await readBody(req));
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/account", siteOrigin(req)), 303);
}
