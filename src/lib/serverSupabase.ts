import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client for the order / payment routes.
 * Needs SUPABASE_SERVICE_ROLE_KEY (Supabase → Project settings → API → service_role). Never expose it to the browser.
 */
export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Client bound to the caller's access token — used to find out who is calling. */
export function getAnonSupabase(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export { normalizePhone } from '@/lib/phone';
