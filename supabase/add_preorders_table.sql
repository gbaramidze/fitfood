-- Run this once in the Supabase SQL editor to add the Preorder feature
-- to an already-existing FitFood database (safe to re-run).

CREATE TABLE IF NOT EXISTS partner_preorders (
  id TEXT PRIMARY KEY,
  point_id TEXT REFERENCES partner_points(id) ON DELETE CASCADE,
  preorder_number TEXT NOT NULL,
  items JSONB NOT NULL,                -- [{productId, productName, quantity, pricePerUnit, totalPrice}]
  original_amount NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL, -- paid in advance (50% of original)
  comment TEXT NOT NULL,               -- who is taking the preorder
  pickup_date DATE NOT NULL,           -- date the customer will pick up the order (defaults to tomorrow)
  payment_method TEXT NOT NULL,        -- 'card' | 'cash'
  seller_role TEXT NOT NULL DEFAULT 'cashier',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'fulfilled' | 'cancelled'
  linked_sale_id TEXT,                 -- the advance-payment sale record created immediately, for the shift's revenue totals
  fulfilled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If the table already existed from an earlier version of this migration, add the new columns.
ALTER TABLE partner_preorders ADD COLUMN IF NOT EXISTS pickup_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day');
ALTER TABLE partner_preorders ADD COLUMN IF NOT EXISTS linked_sale_id TEXT;

CREATE INDEX IF NOT EXISTS idx_partner_preorders_point ON partner_preorders(point_id);
CREATE INDEX IF NOT EXISTS idx_partner_preorders_status ON partner_preorders(status);
CREATE INDEX IF NOT EXISTS idx_partner_preorders_pickup_date ON partner_preorders(pickup_date);

ALTER TABLE partner_preorders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_preorders' AND policyname = 'Allow public read-write for POS partner_preorders'
  ) THEN
    CREATE POLICY "Allow public read-write for POS partner_preorders" ON partner_preorders FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE partner_preorders;
