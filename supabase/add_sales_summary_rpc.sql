-- Server-side aggregation + pagination for the admin "წერტილების გაყიდვები" page and the cook payroll.
-- Supabase returns at most 1000 rows per request, so totals must NOT be summed from a fetched list.
-- Run once in the Supabase SQL editor (safe to re-run).
--
-- Filters (all optional): p_from (inclusive), p_to (exclusive), p_point_id, p_payment, p_search
-- (receipt number or product name, case-insensitive substring).

-- 1. Shared filter: every sale (completed + refunded) that matches
CREATE OR REPLACE FUNCTION pos_sales_filter(
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_point_id text DEFAULT NULL,
  p_payment text DEFAULT NULL,
  p_search text DEFAULT NULL
) RETURNS SETOF partner_sales
LANGUAGE sql STABLE AS $$
  SELECT s.*
  FROM partner_sales s
  WHERE (p_from IS NULL OR s.created_at >= p_from)
    AND (p_to IS NULL OR s.created_at < p_to)
    AND (p_point_id IS NULL OR s.point_id = p_point_id)
    AND (p_payment IS NULL OR s.payment_method = p_payment)
    AND (
      p_search IS NULL OR btrim(p_search) = ''
      OR position(lower(btrim(p_search)) IN lower(s.receipt_number)) > 0
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements(CASE WHEN jsonb_typeof(s.items) = 'array' THEN s.items ELSE '[]'::jsonb END) it
        WHERE position(lower(btrim(p_search)) IN lower(coalesce(it->>'productName', ''))) > 0
      )
    );
$$;

-- 2. One page of receipts (newest first) + total number of matching receipts
CREATE OR REPLACE FUNCTION pos_sales_page(
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_point_id text DEFAULT NULL,
  p_payment text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM pos_sales_filter(p_from, p_to, p_point_id, p_payment, p_search)),
    'rows', coalesce((
      SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC, x.id)
      FROM (
        SELECT *
        FROM pos_sales_filter(p_from, p_to, p_point_id, p_payment, p_search)
        ORDER BY created_at DESC, id
        LIMIT least(greatest(p_limit, 1), 500)
        OFFSET greatest(p_offset, 0)
      ) x
    ), '[]'::jsonb)
  );
$$;

-- 3. Totals over ALL matching completed receipts + per-product quantity/revenue
--    (the client maps products to categories to get the cook's 5%, so the category toggles stay instant)
CREATE OR REPLACE FUNCTION pos_sales_summary(
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_point_id text DEFAULT NULL,
  p_payment text DEFAULT NULL,
  p_search text DEFAULT NULL
) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  WITH f AS (
    SELECT s.id, s.original_amount, s.total_amount, s.discount_amount, s.items
    FROM pos_sales_filter(p_from, p_to, p_point_id, p_payment, p_search) s
    WHERE s.status = 'completed'
  ),
  items_x AS (
    SELECT
      f.id,
      it->>'productId' AS product_id,
      coalesce(it->>'productName', '') AS product_name,
      coalesce(nullif((it->>'quantity')::numeric, 0), 1) AS qty,
      coalesce(nullif((it->>'pricePerUnit')::numeric, 0), 16) AS unit_nominal,
      coalesce(
        nullif((it->>'totalPrice')::numeric, 0),
        coalesce(nullif((it->>'pricePerUnit')::numeric, 0), 16) * coalesce(nullif((it->>'quantity')::numeric, 0), 1)
      ) AS item_total
    FROM f,
      jsonb_array_elements(CASE WHEN jsonb_typeof(f.items) = 'array' THEN f.items ELSE '[]'::jsonb END) it
  ),
  per_sale AS (
    SELECT
      f.id, f.total_amount, f.discount_amount, f.original_amount,
      coalesce(n.items_nominal, 0) AS items_nominal,
      coalesce(n.item_count, 0) AS item_count
    FROM f
    LEFT JOIN (
      SELECT id, sum(unit_nominal * qty) AS items_nominal, count(*) AS item_count
      FROM items_x
      GROUP BY id
    ) n ON n.id = f.id
  ),
  sale_gross AS (
    SELECT
      ps.*,
      CASE
        WHEN ps.original_amount > 0 THEN ps.original_amount
        WHEN ps.item_count > 0 THEN ps.items_nominal
        ELSE ps.total_amount
      END AS gross
    FROM per_sale ps
  )
  SELECT jsonb_build_object(
    'receipts', (SELECT count(*) FROM sale_gross),
    'gross', (SELECT coalesce(sum(gross), 0) FROM sale_gross),
    'net', (SELECT coalesce(sum(total_amount), 0) FROM sale_gross),
    'discount', (
      SELECT coalesce(sum(CASE WHEN discount_amount > 0 THEN discount_amount ELSE greatest(0, gross - total_amount) END), 0)
      FROM sale_gross
    ),
    'noItemsReceipts', (SELECT count(*) FROM sale_gross WHERE item_count = 0),
    'noItemsGross', (SELECT coalesce(sum(gross), 0) FROM sale_gross WHERE item_count = 0),
    'products', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'productId', product_id,
        'productName', product_name,
        'quantity', q,
        'revenue', r
      ))
      FROM (
        SELECT product_id, product_name, sum(qty) AS q, sum(item_total) AS r
        FROM items_x
        GROUP BY product_id, product_name
      ) p
    ), '[]'::jsonb)
  );
$$;

-- Index that serves the date-range + point filters
CREATE INDEX IF NOT EXISTS idx_partner_sales_point_created ON partner_sales(point_id, created_at DESC);
