-- Site ration orders (/order) + customer account (/account).
-- Run once in the Supabase SQL editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS site_orders (
  id TEXT PRIMARY KEY,                       -- FF-123456
  phone_digits TEXT NOT NULL,                -- 995596569999 (no "+"), matches auth.jwt()->>'phone'
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,                       -- as typed
  address TEXT NOT NULL,
  zone TEXT NOT NULL DEFAULT '',
  program_id TEXT NOT NULL,
  program_title TEXT NOT NULL DEFAULT '',
  calories INT NOT NULL,
  days INT NOT NULL,
  start_date DATE NOT NULL,
  delivery_slot TEXT NOT NULL DEFAULT '',    -- "20:00 – 21:00"
  stop_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  swaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  comment TEXT,
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,             -- calculated on the server, never taken from the browser
  payment_method TEXT NOT NULL DEFAULT 'online', -- 'online' | 'transfer' | 'gym'
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid' | 'pending' | 'paid' | 'failed'
  payment_ref TEXT,                          -- id at the payment provider
  payment_code TEXT,                         -- 'gym' payments: code the customer tells at the gym (partner window, later)
  pay_point_id TEXT,                         -- 'gym' payments: partner_points.id of the chosen gym
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC(10, 2),
  payment_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',        -- 'new' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  language TEXT DEFAULT 'ru',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_orders_phone ON site_orders(phone_digits);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_orders_pay_code ON site_orders(payment_code) WHERE payment_code IS NOT NULL;

ALTER TABLE site_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- A signed-in customer (phone + SMS code) can read only their own orders.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_orders' AND policyname = 'Customers read own orders') THEN
    CREATE POLICY "Customers read own orders" ON site_orders FOR SELECT
      USING (phone_digits = (auth.jwt() ->> 'phone'));
  END IF;
  -- Inserts / updates are done by the server (service role key bypasses RLS). No public write policy on purpose.
END $$;
