// Partner discount rules — single source of truth for POS, preorders, receipt edit and reports.
//   • Regular sale ("buy now"): dishes get NO discount, drinks get -50% of the line total
//   • Preorder: dishes get -3 ₾ per unit (never more than the unit price); drinks aren't sold in preorders
// Legacy receipts keep their old discount types ('percent50' = -50% on whole receipt,
// 'fixed4' = -4 ₾ per unit), they are still calculated the old way so history stays correct.

export const PREORDER_DISH_DISCOUNT_GEL = 3;
export const PARTNER_DRINK_DISCOUNT_RATE = 0.5;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function isDrinkCategory(category?: string | null): boolean {
  const cat = (category || '').toLowerCase();
  return (
    cat.includes('drink') ||
    cat.includes('detox') ||
    cat.includes('სასმელ') ||
    cat.includes('напит')
  );
}

export interface DiscountLine {
  unitPrice: number;
  quantity: number;
  isDrink: boolean;
}

/** Partner discount on a regular sale: -50% on drinks only, dishes are full price. */
export function calcPartnerDiscount(lines: DiscountLine[]): { drinkDiscount: number; total: number } {
  const drinkDiscount = round2(
    lines.reduce(
      (sum, l) => (l.isDrink ? sum + l.unitPrice * l.quantity * PARTNER_DRINK_DISCOUNT_RATE : sum),
      0
    )
  );
  return { drinkDiscount, total: drinkDiscount };
}

/** Preorder discount: -3 ₾ per dish unit (capped at the unit price). */
export function calcPreorderDiscount(lines: { unitPrice: number; quantity: number }[]): number {
  return round2(
    lines.reduce((sum, l) => sum + Math.min(PREORDER_DISH_DISCOUNT_GEL, l.unitPrice) * l.quantity, 0)
  );
}
