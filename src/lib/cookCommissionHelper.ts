import { AdminDish } from '@/types/admin';
import { PartnerSaleItem } from '@/types/partner';

export const COOK_CATEGORIES = [
  { id: 'poultry', label: 'ქათამი / ფრინველი', icon: '🍗' },
  { id: 'meat', label: 'ხორცი', icon: '🥩' },
  { id: 'fish', label: 'თევზი & ზღვის პროდ.', icon: '🐟' },
  { id: 'breakfast', label: 'საუზმე & ხაჭო', icon: '🥞' },
  { id: 'salad', label: 'სალათი', icon: '🥗' },
  { id: 'soup', label: 'სუპი & წვნიანი', icon: '🍲' },
  { id: 'dessert', label: 'დესერტი', icon: '🧁' },
  { id: 'drinks', label: 'სასმელები & ყავა', icon: '🥤' },
];

export const DEFAULT_EXCLUDED_CATEGORIES = ['drinks'];

export const DRINK_COFFEE_KEYWORDS = [
  'ყავა', 'coffee', 'кофе',
  'კაპუჩინო', 'cappuccino', 'капучино',
  'ამერიკანო', 'americano', 'американо',
  'ესპრესო', 'espresso', 'эспрессо',
  'ლატე', 'latte', 'латте',
  'ფლეტ', 'flat white', 'флэт',
  'ჩაი', 'tea', 'чай',
  'წყალი', 'water', 'вода',
  'სასმელ', 'drink', 'напиток',
  'სმუზი', 'smoothie', 'смузи',
  'დეტოქს', 'detox', 'детокс',
  'cola', 'კოლა', 'redbull', 'red bull', 'pepsi'
];

/**
 * Checks if a sale item belongs to kitchen / cook preparation
 * (e.g. excludes coffee/drinks when 'drinks' is in excludedCategories).
 */
export function isCookItem(
  it: { productId?: string; productName: string },
  dishes: AdminDish[] = [],
  excludedCategories: string[] = DEFAULT_EXCLUDED_CATEGORIES
): boolean {
  const nameNorm = (it.productName || '').trim().toLowerCase();

  // 1. Match against dishes database
  const dish = dishes.find(d => 
    (it.productId && d.id === it.productId) ||
    (typeof d.name === 'object' && (
      (d.name.ka && d.name.ka.trim().toLowerCase() === nameNorm) ||
      (d.name.ru && d.name.ru.trim().toLowerCase() === nameNorm) ||
      (d.name.en && d.name.en.trim().toLowerCase() === nameNorm)
    )) ||
    (typeof d.name === 'string' && (d.name as string).trim().toLowerCase() === nameNorm)
  );

  if (dish && dish.category) {
    if (excludedCategories.includes(dish.category)) {
      return false;
    }
  }

  // 2. Keyword fallback check for drinks / coffee if 'drinks' is excluded
  if (excludedCategories.includes('drinks')) {
    if (DRINK_COFFEE_KEYWORDS.some(kw => nameNorm.includes(kw))) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates cook and non-cook breakdowns for a list of sale items or sale
 */
export function calculateSaleCookBreakdown(
  items: PartnerSaleItem[] = [],
  dishes: AdminDish[] = [],
  excludedCategories: string[] = DEFAULT_EXCLUDED_CATEGORIES
) {
  let cookGross = 0;
  let excludedGross = 0;
  let cookUnits = 0;
  let excludedUnits = 0;

  items.forEach(it => {
    const qty = Number(it.quantity) || 1;
    const unitPrice = Number(it.pricePerUnit) || (Number(it.totalPrice) / qty) || 16;
    const itemTotal = Number(it.totalPrice) || (unitPrice * qty);

    if (isCookItem(it, dishes, excludedCategories)) {
      cookGross += itemTotal;
      cookUnits += qty;
    } else {
      excludedGross += itemTotal;
      excludedUnits += qty;
    }
  });

  return {
    cookGross,
    excludedGross,
    cookUnits,
    excludedUnits,
    cookCommission: Math.round((cookGross * 0.05) * 100) / 100,
  };
}
