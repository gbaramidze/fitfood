-- ============================================================================
-- FITFOOD PARTNER POS & LOGISTICS - DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Partner Points (Gyms, Cafes, Hubs)
CREATE TABLE IF NOT EXISTS partner_points (
  id TEXT PRIMARY KEY,
  name JSONB NOT NULL,                 -- {"ru": "...", "ka": "...", "en": "..."}
  city TEXT NOT NULL DEFAULT 'Batumi',
  address JSONB NOT NULL,              -- {"ru": "...", "ka": "...", "en": "..."}
  cashier_pin TEXT NOT NULL DEFAULT '1111',
  manager_pin TEXT NOT NULL DEFAULT '7777',
  commission_percent NUMERIC(5, 2) DEFAULT 0,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Partner Products (Dishes, Meals, Drinks, Desserts)
CREATE TABLE IF NOT EXISTS partner_products (
  id TEXT PRIMARY KEY,
  slug TEXT,
  name JSONB NOT NULL,                 -- {"ru": "...", "ka": "...", "en": "..."}
  description JSONB,                   -- {"ru": "...", "ka": "...", "en": "..."}
  category TEXT NOT NULL,              -- 'poultry' | 'fish' | 'meat' | 'breakfast' | 'drinks' | 'dessert' | 'salad'
  category_name JSONB,                 -- {"ru": "...", "ka": "...", "en": "..."}
  meal_type TEXT DEFAULT 'lunch',      -- 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
  day TEXT DEFAULT 'mon',              -- 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
  price NUMERIC(10, 2) NOT NULL,       -- Retail price in GEL (₾)
  cost_price NUMERIC(10, 2) DEFAULT 0, -- Wholesale/Production cost
  calories INT NOT NULL,
  protein NUMERIC(6, 1) DEFAULT 0,
  fat NUMERIC(6, 1) DEFAULT 0,
  carbs NUMERIC(6, 1) DEFAULT 0,
  weight_grams INT NOT NULL,
  image TEXT NOT NULL,
  ingredients JSONB,                   -- {"ru": [...], "ka": [...], "en": [...]}
  allergens JSONB,                     -- ["გლუტენი", ...]
  cooking_method TEXT DEFAULT 'sous_vide',
  target_channels JSONB,               -- ["site", "pos"]
  badge JSONB,                         -- {"ru": "Хит", "ka": "ტოპ", "en": "Top"}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Partner Stocks (Shelf inventory per point)
CREATE TABLE IF NOT EXISTS partner_stocks (
  point_id TEXT REFERENCES partner_points(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES partner_products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (point_id, product_id)
);

-- 4. Partner Sales (Operations, Receipts, Payments)
CREATE TABLE IF NOT EXISTS partner_sales (
  id TEXT PRIMARY KEY,
  point_id TEXT REFERENCES partner_points(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  items JSONB NOT NULL,                -- [{productId, productName, quantity, pricePerUnit, totalPrice}]
  original_amount NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'none', -- 'none' | 'fixed4' | 'free'
  discount_comment TEXT,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,        -- 'card' | 'cash' | 'split'
  split_details JSONB,                 -- {"cashAmount": 10, "cardAmount": 22}
  seller_role TEXT NOT NULL DEFAULT 'cashier', -- 'cashier' | 'manager'
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',    -- 'completed' | 'refunded'
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Partner Shipments (Logistics batches from HQ kitchen to points)
CREATE TABLE IF NOT EXISTS partner_shipments (
  id TEXT PRIMARY KEY,
  shipment_number TEXT NOT NULL,
  point_id TEXT REFERENCES partner_points(id) ON DELETE CASCADE,
  items JSONB NOT NULL,                -- [{productId, productName, quantity}]
  total_units INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received', -- 'received' | 'pending' | 'cancelled'
  note TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Partner Write-Offs (Damaged, expired or marketing samples)
CREATE TABLE IF NOT EXISTS partner_write_offs (
  id TEXT PRIMARY KEY,
  point_id TEXT REFERENCES partner_points(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES partner_products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  reason TEXT NOT NULL,                -- 'expired' | 'damaged' | 'sample' | 'other'
  reason_text TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Admin Operating Expenses (Rent, Utilities, Marketing, Packaging, etc.)
CREATE TABLE IF NOT EXISTS admin_expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,              -- 'rent' | 'utilities' | 'packaging' | 'marketing' | 'logistics' | 'ingredients' | 'equipment' | 'other'
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  point_id TEXT DEFAULT 'hq',
  point_name TEXT,
  payment_method TEXT NOT NULL DEFAULT 'bank', -- 'bank' | 'card' | 'cash'
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Admin Staff Salaries & Payroll
CREATE TABLE IF NOT EXISTS admin_salaries (
  id TEXT PRIMARY KEY,
  employee_name TEXT NOT NULL,
  role TEXT NOT NULL,                  -- 'chef' | 'sous_chef' | 'cook' | 'packer' | 'courier' | 'manager' | 'nutritionist'
  phone TEXT,
  monthly_salary NUMERIC(10, 2) NOT NULL,
  shift_rate NUMERIC(10, 2),
  shifts_count INT DEFAULT 24,
  bonus NUMERIC(10, 2) DEFAULT 0,
  deductions NUMERIC(10, 2) DEFAULT 0,
  total_to_pay NUMERIC(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'paid' | 'pending' | 'partially_paid'
  last_paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Admin Blog Articles & SEO CMS
CREATE TABLE IF NOT EXISTS admin_blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title JSONB NOT NULL,                -- {"ru": "...", "ka": "...", "en": "..."}
  excerpt JSONB NOT NULL,              -- {"ru": "...", "ka": "...", "en": "..."}
  content JSONB NOT NULL,              -- {"ru": "...", "ka": "...", "en": "..."}
  category TEXT NOT NULL DEFAULT 'nutrition',
  cover_image TEXT NOT NULL,
  read_time_min INT DEFAULT 4,
  author TEXT NOT NULL,
  published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  views_count INT DEFAULT 0,
  seo_title JSONB,
  seo_description JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR FAST QUERYING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_partner_sales_point ON partner_sales(point_id);
CREATE INDEX IF NOT EXISTS idx_partner_sales_created ON partner_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_partner_shipments_point ON partner_shipments(point_id);
CREATE INDEX IF NOT EXISTS idx_partner_writeoffs_point ON partner_write_offs(point_id);
CREATE INDEX IF NOT EXISTS idx_admin_expenses_date ON admin_expenses(date);
CREATE INDEX IF NOT EXISTS idx_admin_salaries_status ON admin_salaries(payment_status);
CREATE INDEX IF NOT EXISTS idx_admin_blog_slug ON admin_blog_posts(slug);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Permissive for POS Terminals & Authenticated Staff
-- ============================================================================
ALTER TABLE partner_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_write_offs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for POS partner_points" ON partner_points FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for POS partner_products" ON partner_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for POS partner_stocks" ON partner_stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for POS partner_sales" ON partner_sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for POS partner_shipments" ON partner_shipments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for POS partner_write_offs" ON partner_write_offs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for admin_expenses" ON admin_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for admin_salaries" ON admin_salaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for admin_blog_posts" ON admin_blog_posts FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE partner_points, partner_products, partner_stocks, partner_sales, partner_shipments, partner_write_offs, admin_expenses, admin_salaries, admin_blog_posts;

