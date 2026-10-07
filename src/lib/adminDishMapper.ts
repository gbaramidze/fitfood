import { AdminDish } from '@/types/admin';

export function mapSupabaseProductToAdminDish(row: any): AdminDish {
  if (!row) return {} as AdminDish;

  // 1. Name parsing (can be object {ka, ru, en}, JSON string, or plain string)
  let nameKa = 'კერძი';
  let nameRu = 'Блюдо';
  let nameEn = 'Dish';

  if (row.name && typeof row.name === 'object') {
    nameKa = row.name.ka || row.name.ru || row.name.en || 'კერძი';
    nameRu = row.name.ru || row.name.ka || row.name.en || 'Блюдо';
    nameEn = row.name.en || row.name.ka || row.name.ru || 'Dish';
  } else if (typeof row.name === 'string') {
    try {
      const parsed = JSON.parse(row.name);
      if (parsed && typeof parsed === 'object') {
        nameKa = parsed.ka || parsed.ru || parsed.en || row.name;
        nameRu = parsed.ru || parsed.ka || parsed.en || row.name;
        nameEn = parsed.en || parsed.ka || parsed.ru || row.name;
      } else {
        nameKa = row.name;
        nameRu = row.name;
        nameEn = row.name;
      }
    } catch {
      nameKa = row.name;
      nameRu = row.name;
      nameEn = row.name;
    }
  }

  // 2. Description parsing
  let descKa = 'საბალანსირებული ჯანსაღი კერძი.';
  let descRu = 'Сбалансированное полезное блюдо.';
  let descEn = 'Balanced healthy meal.';

  if (row.description && typeof row.description === 'object') {
    descKa = row.description.ka || row.description.ru || row.description.en || descKa;
    descRu = row.description.ru || row.description.ka || row.description.en || descRu;
    descEn = row.description.en || row.description.ka || row.description.ru || descEn;
  } else if (typeof row.description === 'string' && row.description.trim()) {
    try {
      const parsed = JSON.parse(row.description);
      if (parsed && typeof parsed === 'object') {
        descKa = parsed.ka || parsed.ru || descKa;
        descRu = parsed.ru || parsed.ka || descRu;
        descEn = parsed.en || parsed.ka || descEn;
      } else {
        descKa = row.description;
        descRu = row.description;
        descEn = row.description;
      }
    } catch {
      descKa = row.description;
      descRu = row.description;
      descEn = row.description;
    }
  }

  // 3. Ingredients parsing
  let ingKa: string[] = [];
  let ingRu: string[] = [];
  let ingEn: string[] = [];

  if (row.ingredients && typeof row.ingredients === 'object') {
    if (Array.isArray(row.ingredients)) {
      ingKa = row.ingredients;
      ingRu = row.ingredients;
      ingEn = row.ingredients;
    } else {
      ingKa = Array.isArray(row.ingredients.ka) ? row.ingredients.ka : [];
      ingRu = Array.isArray(row.ingredients.ru) ? row.ingredients.ru : ingKa;
      ingEn = Array.isArray(row.ingredients.en) ? row.ingredients.en : ingKa;
    }
  } else if (typeof row.ingredients === 'string') {
    try {
      const parsed = JSON.parse(row.ingredients);
      if (Array.isArray(parsed)) {
        ingKa = parsed;
        ingRu = parsed;
        ingEn = parsed;
      } else if (parsed && typeof parsed === 'object') {
        ingKa = Array.isArray(parsed.ka) ? parsed.ka : [];
        ingRu = Array.isArray(parsed.ru) ? parsed.ru : ingKa;
        ingEn = Array.isArray(parsed.en) ? parsed.en : ingKa;
      }
    } catch {
      ingKa = row.ingredients.split('\n').map((s: string) => s.trim()).filter(Boolean);
      ingRu = ingKa;
      ingEn = ingKa;
    }
  }

  // 4. Target channels
  let channels: ('site' | 'pos')[] = ['site', 'pos'];
  if (Array.isArray(row.target_channels) && row.target_channels.length > 0) {
    channels = row.target_channels;
  } else if (Array.isArray(row.targetChannels) && row.targetChannels.length > 0) {
    channels = row.targetChannels;
  }

  // 5. Day of week
  const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  let dishDay = 'mon';
  if (row.day && validDays.includes(String(row.day).toLowerCase())) {
    dishDay = String(row.day).toLowerCase();
  }

  // 6. Macros
  const calories = Number(row.calories) || (typeof row.macros === 'object' ? Number(row.macros?.calories) : 0) || 0;
  const protein = Number(row.protein) || (typeof row.macros === 'object' ? Number(row.macros?.protein) : 0) || 0;
  const fat = Number(row.fat) || (typeof row.macros === 'object' ? Number(row.macros?.fat) : 0) || 0;
  const carbs = Number(row.carbs) || (typeof row.macros === 'object' ? Number(row.macros?.carbs) : 0) || 0;
  const weightGrams = Number(row.weight_grams) || Number(row.weight) || (typeof row.macros === 'object' ? Number(row.macros?.weightGrams) : 0) || 300;

  // 7. Pricing
  const retailPrice = Number(row.price) || Number(row.retailPrice) || 15;
  const costPrice = Number(row.cost_price) || Number(row.costPrice) || 0;

  // 8. Image
  const image = row.image || '/images/meals/chicken-ptitim.webp';

  return {
    id: String(row.id || `dish-${Date.now()}`),
    slug: String(row.slug || row.id || 'dish'),
    name: { ka: nameKa, ru: nameRu, en: nameEn },
    description: { ka: descKa, ru: descRu, en: descEn },
    category: row.category || 'poultry',
    mealType: row.meal_type || row.mealType || 'lunch',
    day: dishDay as any,
    macros: { calories, protein, fat, carbs, weightGrams },
    costPrice,
    retailPrice,
    targetChannels: channels,
    image,
    tags: Array.isArray(row.tags) ? row.tags : ['#FitFood'],
    allergens: Array.isArray(row.allergens) ? row.allergens : [],
    cookingMethod: row.cooking_method || row.cookingMethod || 'sous_vide',
    ingredients: { ka: ingKa, ru: ingRu, en: ingEn },
    isGeorgianFit: true,
    inStockCount: Number(row.in_stock_count) || Number(row.inStockCount) || 0,
    sortOrder: row.sort_order !== undefined ? Number(row.sort_order) : row.sortOrder !== undefined ? Number(row.sortOrder) : undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}
