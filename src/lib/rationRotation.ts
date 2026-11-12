import { Dish, DayOfWeek, MealType } from '@/types';

/**
 * Smart ration menu — REAL portions, nothing is scaled.
 *
 * A ration with N meals a day needs a dish for EVERY slot of EVERY day (breakfast and dinner
 * included). Dishes the admin put on a weekday are used for that weekday first (taking turns
 * week by week when there are several). A slot nobody covers is filled from the dishes of the same
 * kind on other days — repeats are fine — and those fillers are chosen so the day lands as close
 * as possible to the ration's calories. A ration whose slots cannot be filled at all (e.g. 6 meals
 * a day but no snack or dessert in the database) is reported by `isFeasible`, and the site hides it.
 */

export const MEAL_ORDER: MealType[] = ['breakfast', 'snack', 'lunch', 'dinner', 'dessert', 'smoothie'];

const SNACK_LIKE: MealType[] = ['snack', 'dessert', 'smoothie'];

/** The meals of a day, in the order they are eaten, for 3..6 meals a day. */
const SLOT_PLANS: Record<number, MealType[]> = {
  3: ['breakfast', 'lunch', 'dinner'],
  4: ['breakfast', 'lunch', 'snack', 'dinner'],
  5: ['breakfast', 'snack', 'lunch', 'snack', 'dinner'],
  6: ['breakfast', 'snack', 'lunch', 'snack', 'dinner', 'dessert'],
};

export const slotPlan = (meals: number): MealType[] => SLOT_PLANS[Math.min(6, Math.max(3, Math.round(meals)))];

const WEEKDAY_KEYS: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const weekdayKey = (date: Date): DayOfWeek => WEEKDAY_KEYS[date.getDay()];

// Monday 2024-01-01: weeks are counted from here, so every device agrees on the rotation.
const ANCHOR = new Date(2024, 0, 1);
export function rotationWeek(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(Math.round((d.getTime() - ANCHOR.getTime()) / 86400000) / 7);
}

const accepts = (slot: MealType, dish: Dish) =>
  slot === dish.mealType || (SNACK_LIKE.includes(slot) && SNACK_LIKE.includes(dish.mealType));

/** Dishes that can fill `slot`, exact kind first. */
const candidatesFor = (slot: MealType, pool: Dish[]) =>
  pool
    .filter(d => accepts(slot, d))
    .map((d, i) => ({ d, i, rank: d.mealType === slot ? 0 : 1 }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map(x => x.d);

/** Can every slot of a `meals`-a-day ration be filled from this pool? */
export function isFeasible(meals: number, pool: Dish[]): boolean {
  return slotPlan(meals).every(slot => pool.some(d => accepts(slot, d)));
}

/**
 * Can the ration be sold honestly? Every slot must be fillable AND real portions must land near the
 * ration's calories: over a sample week the average miss may not exceed 20% (e.g. 3000 kcal from
 * 400-kcal dishes never gets there, so it stays "in the works" until bigger dishes are added).
 */
export function isViable(meals: number, targetKcal: number, pool: Dish[]): boolean {
  if (!isFeasible(meals, pool)) return false;
  let miss = 0;
  for (let d = 0; d < 7; d++) {
    const kcal = buildMenu(new Date(2024, 0, 1 + d), meals, pool, targetKcal).reduce((a, m) => a + m.dish.macros.calories, 0);
    miss += Math.abs(kcal - targetKcal) / targetKcal;
  }
  return miss / 7 <= 0.2;
}

export interface MenuItem {
  /** position in the day (0 = first meal) */
  slot: number;
  dish: Dish;
  /** true = the dish is placed on this weekday; false = repeated from another day to fill the slot */
  own: boolean;
}

const rotate = <T,>(list: T[], by: number) => {
  const n = list.length;
  const k = ((by % n) + n) % n;
  return [...list.slice(k), ...list.slice(0, k)];
};

/**
 * The dishes of `date` for a ration with `meals` meals a day — exactly one per slot, in eating order.
 * `targetKcal` (the ration's calories) steers the choice of the filler dishes.
 */
export function buildMenu(date: Date, meals: number, pool: Dish[], targetKcal?: number): MenuItem[] {
  const plan = slotPlan(meals);
  const day = weekdayKey(date);
  const week = rotationWeek(date);
  const picks: (Dish | null)[] = plan.map(() => null);
  const used = new Set<string>();
  const nth = new Map<MealType, number>();

  // 1) slots the admin covered for this weekday — dishes take turns week by week
  plan.forEach((slot, i) => {
    const n = nth.get(slot) ?? 0;
    nth.set(slot, n + 1);
    const own = candidatesFor(slot, pool).filter(d => d.day === day);
    if (!own.length) return;
    const list = rotate(own, week + n);
    const free = list.find(d => !used.has(d.id));
    if (!free) return; // all own dishes taken (e.g. two snacks, one placed) -> filler phase
    picks[i] = free;
    used.add(free.id);
  });

  // 2) the rest: pick fillers (repeats allowed) so the day gets close to the target calories
  const open = plan.map((_, i) => i).filter(i => picks[i] === null);
  if (open.length) {
    const lists = open.map((i, k) => {
      const all = candidatesFor(plan[i], pool);
      return all.length ? rotate(all, date.getDay() * 2 + week + i + k).slice(0, 8) : [];
    });
    if (lists.every(l => l.length)) {
      const fixed = picks.reduce((a, d) => a + (d ? d.macros.calories : 0), 0);
      let best: Dish[] | null = null;
      let bestCost = Infinity;
      const cur: Dish[] = [];
      const walk = (k: number, sum: number, rank: number) => {
        if (k === lists.length) {
          const dupes = cur.filter((d, x) => used.has(d.id) || cur.findIndex(y => y.id === d.id) !== x).length;
          const cost = (targetKcal ? Math.abs(fixed + sum - targetKcal) : 0) + dupes * 80 + rank * 0.01;
          if (cost < bestCost) { bestCost = cost; best = [...cur]; }
          return;
        }
        lists[k].forEach((d, idx) => {
          cur[k] = d;
          walk(k + 1, sum + d.macros.calories, rank + idx);
        });
      };
      walk(0, 0, 0);
      (best as Dish[] | null)?.forEach((d, k) => { picks[open[k]] = d; });
    }
  }

  // 3) a day that is far from the ration's calories: swap dishes (same kind of meal, repeats allowed)
  //    for the ones that bring it closer. Days within 8% keep the admin's weekly plan untouched.
  if (targetKcal && picks.every(Boolean)) {
    for (let step = 0; step < 6; step++) {
      const cur = picks.reduce((a, d) => a + d!.macros.calories, 0);
      const miss = Math.abs(cur - targetKcal);
      if (miss / targetKcal <= 0.08) break;
      let gain = 0;
      let at = -1;
      let swap: Dish | null = null;
      plan.forEach((slot, i) => {
        for (const d of candidatesFor(slot, pool)) {
          if (picks.some(p => p!.id === d.id)) continue;
          const g = miss - Math.abs(cur - picks[i]!.macros.calories + d.macros.calories - targetKcal);
          if (g > gain) { gain = g; at = i; swap = d; }
        }
      });
      if (at < 0 || !swap) break;
      picks[at] = swap;
    }
  }

  return picks.flatMap((dish, i) => (dish ? [{ slot: i, dish, own: dish.day === day }] : []));
}

/** Dishes a customer may swap `dish` for: same kind of meal, any weekday, not the dish itself. */
export function swapCandidates(dish: Dish, pool: Dish[]): Dish[] {
  return pool.filter(d => d.id !== dish.id && accepts(dish.mealType, d));
}
