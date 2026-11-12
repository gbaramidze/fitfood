-- STOP-list for dishes: a dish put on stop is hidden from the site rations (and from the kitchen plan)
-- until it is switched back on. Run once in the Supabase SQL editor.
ALTER TABLE partner_products ADD COLUMN IF NOT EXISTS stopped BOOLEAN NOT NULL DEFAULT false;
