-- ============================================================================
-- FITFOOD PARTNER POS - INITIAL SEED DATA
-- ============================================================================

-- 1. Seed Partner Points
INSERT INTO partner_points (id, name, city, address, cashier_pin, manager_pin, phone, status)
VALUES
  (
    'point-mega-gym',
    '{"ru": "Mega Gym", "ka": "Mega Gym", "en": "Mega Gym"}'::jsonb,
    'Batumi',
    '{"ru": "ул. Качинских 5Б", "ka": "კაჩინსკების 5ბ", "en": "5B Kachinski St"}'::jsonb,
    '1111',
    '7777',
    '+995 555 11 22 33',
    'active'
  ),
  (
    'point-xxl',
    '{"ru": "XXL", "ka": "XXL", "en": "XXL"}'::jsonb,
    'Batumi',
    '{"ru": "ул. Качинских 1", "ka": "კაცინსკების 1", "en": "1 Kachinski St"}'::jsonb,
    '2222',
    '8888',
    '+995 555 22 33 44',
    'active'
  ),
  (
    'point-fitness-academy',
    '{"ru": "Fitness Academy", "ka": "Fitness Academy", "en": "Fitness Academy"}'::jsonb,
    'Batumi',
    '{"ru": "ул. Пиросмани 18", "ka": "ფიროსმანის 18", "en": "18 Pirosmani St"}'::jsonb,
    '3333',
    '9999',
    '+995 555 33 44 55',
    'active'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  cashier_pin = EXCLUDED.cashier_pin,
  manager_pin = EXCLUDED.manager_pin;

-- 2. Seed Partner Products
INSERT INTO partner_products (id, name, category, category_name, price, cost_price, calories, weight_grams, image, badge)
VALUES
  (
    'prod-chicken-quinoa',
    '{"ru": "Куриное филе гриль с киноа и брокколи", "ka": "ქათმის ფილე გრილზე კინოათი და ბროკოლით", "en": "Grilled Chicken Breast with Quinoa & Broccoli"}'::jsonb,
    'poultry',
    '{"ru": "Птица / Питание", "ka": "ქათამი / კვება", "en": "Poultry / Meals"}'::jsonb,
    16.00,
    9.50,
    420,
    320,
    '/images/meals/turkey-sweetpotato.webp',
    '{"ru": "Хит продаж", "ka": "ტოპ გაყიდვა", "en": "Top Seller"}'::jsonb
  ),
  (
    'prod-tuna-steak',
    '{"ru": "Стейк из тунца с диким рисом и спаржей", "ka": "თუნუქის სტეიკი ველური ბრინჯით და სატაცურით", "en": "Tuna Steak with Wild Rice & Asparagus"}'::jsonb,
    'fish',
    '{"ru": "Рыба и Морепродукты", "ka": "თევზი და ზღვის პროდუქტები", "en": "Fish & Seafood"}'::jsonb,
    22.00,
    13.00,
    380,
    300,
    '/images/meals/salmon-baked.webp',
    '{"ru": "High Protein", "ka": "მაღალი ცილა", "en": "High Protein"}'::jsonb
  ),
  (
    'prod-beef-bowl',
    '{"ru": "Протеиновый боул с говядиной и авокадо", "ka": "პროტეინის ბოული საქონლის ხორცით და ავოკადოთი", "en": "Protein Beef Bowl with Avocado & Egg"}'::jsonb,
    'meat',
    '{"ru": "Мясные рационы", "ka": "ხორცის რაციონები", "en": "Meat Meals"}'::jsonb,
    19.00,
    11.00,
    510,
    340,
    '/images/meals/beef-stew.webp',
    '{"ru": "Набор массы", "ka": "მასის მომატება", "en": "Gain Meal"}'::jsonb
  ),
  (
    'prod-salmon-steamed',
    '{"ru": "Атлантический лосось с запеченными овощами", "ka": "ატლანტიკური ორაგული გამომცხვარი ბოსტნეულით", "en": "Steamed Atlantic Salmon with Vegetables"}'::jsonb,
    'fish',
    '{"ru": "Рыба и Морепродукты", "ka": "თევზი და ზღვის პროდუქტები", "en": "Fish & Seafood"}'::jsonb,
    24.00,
    14.50,
    460,
    310,
    '/images/meals/salmon-baked.webp',
    NULL
  ),
  (
    'prod-syrniki-berry',
    '{"ru": "Фермерские сырники с клубничным соусом", "ka": "ფერმერული სირნიკები მარწყვის სოუსით", "en": "Farm Cottage Cheese Syrniki with Berries"}'::jsonb,
    'breakfast',
    '{"ru": "Завтраки", "ka": "საუზმე", "en": "Breakfast"}'::jsonb,
    12.00,
    6.50,
    345,
    260,
    '/images/meals/syrniki-strawberry.webp',
    '{"ru": "Без сахара", "ka": "უშაქრო", "en": "Zero Sugar"}'::jsonb
  ),
  (
    'prod-detox-smoothie',
    '{"ru": "Зеленый Детокс Смузи (Шпинат, Киви, Мята)", "ka": "მწვანე დეტოქს სმუზი (ისპანახი, კივი, პიტნა)", "en": "Green Detox Smoothie (Spinach, Kiwi, Mint)"}'::jsonb,
    'drinks',
    '{"ru": "Напитки / Детокс", "ka": "სასმელები / დეტოქსი", "en": "Drinks & Detox"}'::jsonb,
    9.00,
    4.50,
    140,
    400,
    '/images/meals/green-smoothie.webp',
    NULL
  ),
  (
    'prod-protein-pudding',
    '{"ru": "Шоколадно-протеиновый мусс с чиа", "ka": "შოკოლადის პროტეინის მუსი ჩიათი", "en": "Chocolate Protein Mousse with Chia Seeds"}'::jsonb,
    'dessert',
    '{"ru": "Десерты FIT", "ka": "FIT დესერტები", "en": "Fit Desserts"}'::jsonb,
    10.00,
    5.00,
    210,
    180,
    '/images/meals/oatmeal-berries.webp',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  calories = EXCLUDED.calories;

-- 3. Seed Shelf Stocks for Points
INSERT INTO partner_stocks (point_id, product_id, quantity)
VALUES
  ('point-mega-gym', 'prod-chicken-quinoa', 18),
  ('point-mega-gym', 'prod-tuna-steak', 9),
  ('point-mega-gym', 'prod-beef-bowl', 7),
  ('point-mega-gym', 'prod-salmon-steamed', 5),
  ('point-mega-gym', 'prod-syrniki-berry', 14),
  ('point-mega-gym', 'prod-detox-smoothie', 12),
  ('point-mega-gym', 'prod-protein-pudding', 8),

  ('point-xxl', 'prod-chicken-quinoa', 24),
  ('point-xxl', 'prod-tuna-steak', 14),
  ('point-xxl', 'prod-beef-bowl', 18),
  ('point-xxl', 'prod-salmon-steamed', 6),
  ('point-xxl', 'prod-syrniki-berry', 10),
  ('point-xxl', 'prod-detox-smoothie', 6),
  ('point-xxl', 'prod-protein-pudding', 12),

  ('point-fitness-academy', 'prod-chicken-quinoa', 12),
  ('point-fitness-academy', 'prod-tuna-steak', 6),
  ('point-fitness-academy', 'prod-beef-bowl', 4),
  ('point-fitness-academy', 'prod-salmon-steamed', 4),
  ('point-fitness-academy', 'prod-syrniki-berry', 8),
  ('point-fitness-academy', 'prod-detox-smoothie', 15),
  ('point-fitness-academy', 'prod-protein-pudding', 10)
ON CONFLICT (point_id, product_id) DO UPDATE SET
  quantity = EXCLUDED.quantity;
