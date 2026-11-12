import crypto from 'node:crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { createPayzePayment, onlinePaymentsConfigured } from '@/lib/payments/payze';

/** 6-character payment code for cash payments at a gym (no 0/O/1/I so it is easy to read out loud). */
export const newPayCode = () => {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => A[crypto.randomInt(A.length)]).join('');
};

export const newOrderId = () => `FF-${crypto.randomInt(100000, 1000000)}`;

/** Creates the card-payment link for a stored order and marks it "pending". Returns null when online payment is not set up. */
export async function startOnlinePayment(
  db: SupabaseClient,
  order: { id: string; total: number; language?: string }
): Promise<{ url: string } | { error: string } | null> {
  if (!onlinePaymentsConfigured()) return null;
  try {
    const lang = order.language === 'ka' || order.language === 'en' ? order.language : 'ru';
    const { url, ref } = await createPayzePayment({ orderId: order.id, amountGEL: Number(order.total), language: lang });
    await db.from('site_orders').update({ payment_status: 'pending', payment_ref: ref || null }).eq('id', order.id);
    return { url };
  } catch (e: any) {
    return { error: e?.message || 'payment error' };
  }
}
