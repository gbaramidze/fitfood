import crypto from 'node:crypto';

/**
 * Online card payment through Payze (https://payze.io).
 *
 * !! NOT TESTED AGAINST THE LIVE API !!  Written from Payze's public v2 "payment" API as remembered
 * (their docs were not reachable while this was built). Before going live, run one real test payment
 * in Payze's test mode and check the three spots marked  // VERIFY  below. Everything Payze-specific
 * is in this one file, so switching to another provider (Flitt, BOG, TBC) means replacing only it.
 *
 * Environment variables (server only, .env.local):
 *   PAYZE_API_KEY, PAYZE_API_SECRET   — from the Payze dashboard
 *   PAYMENT_WEBHOOK_SECRET            — any long random string; signs the webhook URL we give Payze
 *   SUPABASE_SERVICE_ROLE_KEY         — lets the server mark an order as paid
 *   NEXT_PUBLIC_SITE_URL              — public address of the site, e.g. https://fitnessfood.ge
 */

export const onlinePaymentsConfigured = () =>
  Boolean(
    process.env.PAYZE_API_KEY && process.env.PAYZE_API_SECRET && process.env.PAYMENT_WEBHOOK_SECRET &&
      process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SITE_URL
  );

/** Signs the webhook URL so only Payze (who got the URL from us) can mark an order paid. */
export const webhookToken = (orderId: string) =>
  crypto.createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET || '').update(orderId).digest('hex').slice(0, 32);

export const tokenValid = (orderId: string, token: string) => {
  const a = Buffer.from(webhookToken(orderId));
  const b = Buffer.from(String(token || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export async function createPayzePayment(o: {
  orderId: string;
  amountGEL: number;
  language: 'ka' | 'ru' | 'en';
}): Promise<{ url: string; ref: string }> {
  const site = process.env.NEXT_PUBLIC_SITE_URL!.replace(/\/$/, '');
  const res = await fetch('https://payze.io/v2/api/payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${process.env.PAYZE_API_KEY}:${process.env.PAYZE_API_SECRET}`, // VERIFY header format
    },
    body: JSON.stringify({
      source: 'Card',
      amount: o.amountGEL,
      currency: 'GEL',
      language: o.language === 'ka' ? 'KA' : o.language === 'ru' ? 'RU' : 'EN',
      hooks: {
        webhookGateway: `${site}/api/payments/webhook?order=${o.orderId}&t=${webhookToken(o.orderId)}`,
        successRedirectGateway: `${site}/account?paid=${o.orderId}`,
        errorRedirectGateway: `${site}/account?payfail=${o.orderId}`,
      },
      metadata: { Order: { OrderId: o.orderId } },
    }),
  });
  const json: any = await res.json().catch(() => ({}));
  const payment = json?.data?.payment ?? json?.payment; // VERIFY response shape
  const url: string | undefined = payment?.paymentUrl ?? payment?.PaymentUrl;
  if (!res.ok || !url) throw new Error(`Payze did not return a payment link (HTTP ${res.status})`);
  return { url, ref: String(payment?.transactionId ?? payment?.id ?? '') };
}

/** Reads the final state out of a Payze webhook body. */
export function readWebhook(body: any): { paid: boolean; failed: boolean; status: string } {
  const text = JSON.stringify(body ?? {}).toLowerCase();
  const status = String(body?.Payment?.Status ?? body?.payment?.status ?? body?.Status ?? body?.status ?? '').toLowerCase(); // VERIFY field names
  const paid = ['captured', 'committed', 'paid', 'success'].includes(status) || /"status":"(captured|committed)"/.test(text);
  const failed = ['rejected', 'declined', 'failed', 'canceled', 'cancelled', 'refunded'].includes(status);
  return { paid, failed, status };
}
