-- Run this once in the Supabase SQL editor so write-offs record their retail/cost
-- value at the time of write-off (used by the admin statistics page). Safe to re-run.

ALTER TABLE partner_write_offs ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2);
ALTER TABLE partner_write_offs ADD COLUMN IF NOT EXISTS retail_price NUMERIC(10, 2);
