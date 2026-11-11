-- Kitchen tablet (/kitchen): client cards + "cooked / sent" ticks.
-- Run once in the Supabase SQL editor. Until then the tablet keeps everything in the
-- device's local storage (and shows a "local mode" badge).

-- 1. Client cards (ration subscriptions as the kitchen / couriers see them)
CREATE TABLE IF NOT EXISTS kitchen_clients (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  zone TEXT NOT NULL DEFAULT '',
  program_id TEXT NOT NULL DEFAULT '',
  program_title TEXT NOT NULL DEFAULT '',
  calories INT NOT NULL DEFAULT 1500,
  total_days INT NOT NULL DEFAULT 30,
  delivered_days INT NOT NULL DEFAULT 0,
  delivery_slot TEXT NOT NULL DEFAULT 'morning',   -- 'morning' | 'comfort' | 'evening'
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',           -- 'active' | 'paused' | 'completed'
  notes TEXT,                                      -- allergies / stop-list / courier comments
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ticks: one row per (plan day, thing ticked)
--    ref: cook:<productKey> | send:<pointId>:<productKey> | rcook:<dishId> | rsent:<clientId>
CREATE TABLE IF NOT EXISTS kitchen_checks (
  plan_date DATE NOT NULL,
  ref TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT TRUE,
  qty INT,                                         -- quantity the plan asked for when ticked
  done_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (plan_date, ref)
);

CREATE INDEX IF NOT EXISTS idx_kitchen_checks_date ON kitchen_checks(plan_date);

ALTER TABLE kitchen_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_checks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_clients' AND policyname = 'Allow public read-write for kitchen_clients') THEN
    CREATE POLICY "Allow public read-write for kitchen_clients" ON kitchen_clients FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_checks' AND policyname = 'Allow public read-write for kitchen_checks') THEN
    CREATE POLICY "Allow public read-write for kitchen_checks" ON kitchen_checks FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Live sync between tablets (kitchen ↔ courier)
ALTER PUBLICATION supabase_realtime ADD TABLE kitchen_clients;
ALTER PUBLICATION supabase_realtime ADD TABLE kitchen_checks;
