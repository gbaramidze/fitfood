-- ============================================================================
-- SQL ДЛЯ СОЗДАНИЯ ТАБЛИЦ РАСХОДОВ И ЗАРПЛАТ В SUPABASE
-- Скопируйте этот код и запустите в Supabase -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Таблица операционных расходов (Admin Expenses)
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

-- 2. Таблица зарплат и ведомости персонала (Admin Salaries)
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

-- 3. Таблица блога / статей (Admin Blog Posts)
CREATE TABLE IF NOT EXISTS admin_blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title JSONB NOT NULL,
  excerpt JSONB NOT NULL,
  content JSONB NOT NULL,
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

-- Индексы для быстрой работы
CREATE INDEX IF NOT EXISTS idx_admin_expenses_date ON admin_expenses(date);
CREATE INDEX IF NOT EXISTS idx_admin_salaries_status ON admin_salaries(payment_status);

-- Включение доступа (Row Level Security)
ALTER TABLE admin_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for admin_expenses" ON admin_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for admin_salaries" ON admin_salaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for admin_blog_posts" ON admin_blog_posts FOR ALL USING (true) WITH CHECK (true);

-- Добавление в Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE admin_expenses, admin_salaries, admin_blog_posts;
