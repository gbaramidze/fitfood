import { Dish, DayOfWeek, MealType } from '@/types';
import { dishes as classicDishes } from '@/data/dishes';
import { rationDishes } from '@/data/rationDishes';

/**
 * The ration menu runs on a 2-week cycle:
 *   week 1 = the classic menu (src/data/dishes.ts)
 *   week 2 = ration-only dishes from the Excel recipe base (src/data/rationDishes.ts),
 *            falling back to the classic dish of the same weekday + meal wherever week 2
 *            has no dish (snacks, Fri–Sun breakfast, Sun dinner).
 * Everything that needs "what is cooked on date X" (order page, kitchen tablet) goes through here.
 */

/** Every dish a ration can contain (both weeks). */
export const allRationDishes: Dish[] = [...classicDishes, ...rationDishes];

export const MEAL_ORDER: MealType[] = ['breakfast', 'snack', 'lunch', 'dinner', 'dessert', 'smoothie'];

const WEEKDAY_KEYS: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Monday 2024-01-01 — the cycle is counted in whole weeks from here, so every device agrees.
const CYCLE_ANCHOR = new Date(2024, 0, 1);

export function weekdayKey(date: Date): DayOfWeek {
  return WEEKDAY_KEYS[date.getDay()];
}

/** Which week of the 2-week cycle a calendar date falls in. */
export function cycleWeek(date: Date): 1 | 2 {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((d.getTime() - CYCLE_ANCHOR.getTime()) / 86400000);
  const week = Math.floor(days / 7);
  return ((week % 2) + 2) % 2 === 0 ? 1 : 2;
}

/** The dishes cooked and delivered on `date`, one per meal slot, in meal order. */
export function menuForDate(date: Date, pool: Dish[] = allRationDishes): Dish[] {
  const day = weekdayKey(date);
  const onDay = pool.filter(d => d.day === day);
  const classic = onDay.filter(d => (d.week ?? 1) === 1);

  if (cycleWeek(date) === 1) {
    return classic.sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
  }

  const second = onDay.filter(d => d.week === 2);
  const slots = new Set<MealType>([...classic.map(d => d.mealType), ...second.map(d => d.mealType)]);
  const picked: Dish[] = [];
  slots.forEach(slot => {
    // First week-2 dish wins the slot; any further one is a reserve (swap option only).
    const dish = second.find(d => d.mealType === slot) ?? classic.find(d => d.mealType === slot);
    if (dish) picked.push(dish);
  });
  return picked.sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
}

/** Dishes a customer may swap `dish` for: same kind of meal, any week, not the dish itself. */
export function swapCandidates(dish: Dish, pool: Dish[] = allRationDishes): Dish[] {
  const snackLike: MealType[] = ['snack', 'dessert', 'smoothie'];
  const sameKind = (m: MealType) => (snackLike.includes(dish.mealType) ? snackLike.includes(m) : m === dish.mealType);
  return pool.filter(d => d.id !== dish.id && sameKind(d.mealType));
}
