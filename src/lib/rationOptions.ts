/**
 * Calorie levels and how many meals a day each level has (independent of the program — the calculator picks the level).
 * `enabled: false` = not offered on the site for now (kept so old client cards still resolve their meal count).
 */
export interface CalorieOption {
  cal: number;
  meals: number;
  enabled?: boolean;
}

export const CALORIE_LEVELS: CalorieOption[] = [
  { cal: 750, meals: 3, enabled: false },
  { cal: 1000, meals: 3 },
  { cal: 1250, meals: 4 },
  { cal: 1500, meals: 5 },
  { cal: 1800, meals: 5 },
  { cal: 2200, meals: 6 },
  { cal: 2500, meals: 6 },
  { cal: 3000, meals: 6 },
];

/** The levels currently offered (the site additionally hides any the menu cannot serve). */
export const enabledOptions = (_programId?: string): CalorieOption[] => CALORIE_LEVELS.filter(o => o.enabled !== false);

/** Meals per day for a calorie level (5 when unknown). The program no longer matters. */
export function mealsFor(_programId: string | undefined, calories: number): number {
  return CALORIE_LEVELS.find(o => o.cal === calories)?.meals ?? 5;
}
