import { Dish, DayOfWeek, MealType } from '@/types';

/**
 * The ration menu is ONE WEEK: every dish the admin put on a weekday is part of that weekday,
 * and the same week repeats. The order page, the customer account and the kitchen tablet all
 * go through here, so they always agree on "what is cooked on date X".
 */

export const MEAL_ORDER: MealType[] = ['breakfast', 'snack', 'lunch', 'dinner', 'dessert', 'smoothie'];

const WEEKDAY_KEYS: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function weekdayKey(date: Date): DayOfWeek {
  return WEEKDAY_KEYS[date.getDay()];
}

/** All dishes of `date`'s weekday, in meal order (the database order is kept within a meal). */
export function menuForDate(date: Date, pool: Dish[]): Dish[] {
  const day = weekdayKey(date);
  return pool
    .filter(d => d.day === day)
    .map((d, i) => ({ d, i }))
    .sort((a, b) => MEAL_ORDER.indexOf(a.d.mealType) - MEAL_ORDER.indexOf(b.d.mealType) || a.i - b.i)
    .map(x => x.d);
}

/** Dishes a customer may swap `dish` for: same kind of meal, any weekday, not the dish itself. */
export function swapCandidates(dish: Dish, pool: Dish[]): Dish[] {
  const snackLike: MealType[] = ['snack', 'dessert', 'smoothie'];
  const sameKind = (m: MealType) => (snackLike.includes(dish.mealType) ? snackLike.includes(m) : m === dish.mealType);
  return pool.filter(d => d.id !== dish.id && sameKind(d.mealType));
}
