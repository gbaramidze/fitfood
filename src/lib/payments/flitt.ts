import crypto from 'node:crypto';

/**
 * Online card payment through Flitt (https://flitt.com, ex-Fondy) — hosted checkout page.
 * Docs: https://docs.flitt.com/api/create-order/  and  https://docs.flitt.com/api/building-signature/
 *
 * Environment variables (server only, .env.local / hosting dashboard):
 *   FLITT_MERCHANT_ID       — merchant number
 *   FLITT_PAYMENT_KEY       — "payment key"; signs every request and verifies every callback
 *   SUPABASE_SERVICE_ROLE_KEY — lets the server mark an order as paid
 *   NEXT_PUBLIC_SITE_URL    — public address of the site, e.g. https://fitnessfood.ge (Flitt must be able to reach it)
 *
 * The "credit key" Flitt also issues is only for payouts to cards (money OUT) — taking payments does not need it.
 */

const API = 'https://pay.flitt.com/api/checkout/url';

export const onlinePaymentsConfigured = () =>
  Boolean(
    process.env.FLITT_MERCHANT_ID && process.env.FLITT_PAYMENT_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SITE_URL
  );

/** SHA-1 over: payment key | all non-empty params sorted by name, values joined with "|". "0" is kept. */
export function sign(params: Record<string, unknown>): string {
  const parts = Object.keys(params)
    .filter(k => k !== 'signature' && k !== 'response_signature_string')
    .sort()
    .map(k => params[k])
    .filter(v => v !== undefined && v !== null && v !== '')
    .map(v => String(v));
  return crypto.createHash('sha1').update([process.env.FLITT_PAYMENT_KEY || '', ...parts].join('|'), 'utf8').digest('hex');
}

/** True when the signature on a Flitt callback / redirect body matches. */
export function signatureValid(body: Record<string, unknown>): boolean {
  const given = String(body?.signature ?? '');
  if (!given) return false;
  const a = Buffer.from(sign(body));
  const b = Buffer.from(given.toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Every payment attempt gets its own Flitt order id (a retry of the same order must not collide). */
export const flittOrderId = (orderId: string) => `${orderId}_${Date.now().toString(36)}`;
export const siteOrderId = (flittId: string) => String(flittId || '').split('_')[0];

export async function createFlittPayment(o: {
  orderId: string;
  amountGEL: number;
  language: 'ka' | 'ru' | 'en';
}): Promise<{ url: string; ref: string }> {
  const site = process.env.NEXT_PUBLIC_SITE_URL!.replace(/\/$/, '');
  const request: Record<string, unknown> = {
    order_id: flittOrderId(o.orderId),
    merchant_id: Number(process.env.FLITT_MERCHANT_ID),
    order_desc: `FitFood ${o.orderId}`,
    amount: Math.round(o.amountGEL * 100), // tetri
    currency: 'GEL',
    lang: o.language,
    lifetime: 3600, // unpaid link expires in 1 hour; the customer can request a new one from the account page
    response_url: `${site}/api/payments/return`,
    server_callback_url: `${site}/api/payments/webhook`,
  };
  request.signature = sign(request);

  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request }),
  });
  const json: any = await res.json().catch(() => ({}));
  const r = json?.response;
  if (!res.ok || r?.response_status !== 'success' || !r?.checkout_url) {
    throw new Error(`Flitt: ${r?.error_message || `HTTP ${res.status}`}${r?.error_code ? ` (${r.error_code})` : ''}`);
  }
  return { url: String(r.checkout_url), ref: String(r.payment_id ?? '') };
}

/** Flitt posts JSON (callback) or an HTML form (browser redirect). Returns the flat parameter object either way. */
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get('content-type') || '';
  try {
    if (type.includes('application/json')) {
      const j: any = await req.json();
      return j?.response && typeof j.response === 'object' ? j.response : j ?? {};
    }
    return Object.fromEntries((await req.formData()).entries());
  } catch {
    return {};
  }
}

/** What a verified Flitt notification means for the order. */
export function readStatus(body: Record<string, unknown>): { paid: boolean; failed: boolean; status: string } {
  const status = String(body?.order_status ?? '').toLowerCase();
  return {
    status,
    paid: status === 'approved',
    failed: ['declined', 'expired', 'reversed'].includes(status),
  };
}
