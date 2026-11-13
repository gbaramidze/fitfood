import { Dish, DayOfWeek, MealType } from '@/types';
import type { MacroGoal } from '@/lib/calorieCalc';

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

const sumOf = (dishes: Dish[]) =>
  dishes.reduce(
    (a, d) => ({ kcal: a.kcal + d.macros.calories, p: a.p + d.macros.protein, f: a.f + d.macros.fat, c: a.c + d.macros.carbs }),
    { kcal: 0, p: 0, f: 0, c: 0 }
  );

/**
 * How far a day is from what the customer needs, in "kcal-equivalents".
 * Calories alone when there is no macro goal; with a goal the protein, fat and carbs misses count too
 * (protein shortfall fully, protein excess lightly, fat and carbs half) — 20 g of protein short on 166 g costs as much as ~250 kcal off.
 */
function dayCost(t: { kcal: number; p: number; f: number; c: number }, targetKcal: number, goal?: MacroGoal): number {
  if (!goal || !targetKcal) return Math.abs(t.kcal - targetKcal);
  const kcalMiss = t.kcal < targetKcal ? 1.5 * (targetKcal - t.kcal) : t.kcal - targetKcal; // under the target hurts more
  const rel = (v: number, want: number) => (want > 0 ? Math.abs(v - want) / want : 0);
  // protein short of the goal hurts; protein above it is nearly harmless
  const protein = goal.protein > 0 ? (t.p < goal.protein ? (goal.protein - t.p) / goal.protein : 0.3 * ((t.p - goal.protein) / goal.protein)) : 0;
  return kcalMiss + targetKcal * (protein + 0.5 * rel(t.f, goal.fat) + 0.5 * rel(t.c, goal.carbs));
}

/**
 * Is the day close enough that the admin's plan can stay as it is?
 * Without a goal: 8% on calories. With a goal (the customer's own numbers) it is stricter:
 * at most 3% under / 5% over, and protein not more than 7% short.
 */
function dayOk(t: { kcal: number; p: number }, targetKcal: number, goal?: MacroGoal): boolean {
  if (!goal) return Math.abs(t.kcal - targetKcal) / targetKcal <= 0.08;
  const rel = (t.kcal - targetKcal) / targetKcal;
  if (rel < -0.03 || rel > 0.05) return false;
  return goal.protein <= 0 || t.p >= goal.protein * 0.93;
}

const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
const dayStamp = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
const weekCache = new WeakMap<Dish[], Map<string, MenuItem[]>>();

/**
 * The dishes of `date` for a ration with `meals` meals a day — exactly one per slot, in eating order.
 * `targetKcal` (the ration's calories) steers the choice of the filler dishes.
 *
 * With a `goal` (the protein / fat / carbs the customer needs) the menu is balanced over the WEEK:
 * days are built one after another in blocks of 7 (from `startDate`, else from Monday), and whatever a
 * day missed (calories, protein, fat, carbs) is added to the next day's aim. A day that comes out a few
 * percent light is therefore made up the next day, so the week lands on the customer's numbers.
 */
export function buildMenu(date: Date, meals: number, pool: Dish[], targetKcal?: number, goal?: MacroGoal, startDate?: Date): MenuItem[] {
  if (!targetKcal || !goal) return buildDay(date, meals, pool, targetKcal, goal);

  const stamp = dayStamp(date);
  const first = startDate ? dayStamp(startDate) : stamp - ((date.getDay() + 6) % 7); // block start (Monday if no start)
  const inBlock = stamp < first ? 0 : startDate ? (stamp - first) % 7 : stamp - first;
  const blockFirst = stamp - inBlock;
  const base = `${meals}|${targetKcal}|${goal.protein}|${goal.fat}|${goal.carbs}`;
  let cache = weekCache.get(pool);
  if (!cache) weekCache.set(pool, (cache = new Map()));
  const hit = cache.get(`${base}|${stamp}|${blockFirst}`);
  if (hit) return hit;

  let carry = { kcal: 0, p: 0, f: 0, c: 0 };
  let result: MenuItem[] = [];
  for (let st = blockFirst; st <= stamp; st++) {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate() - (stamp - st));
    const key = `${base}|${st}|${blockFirst}`;
    let items = cache.get(key);
    if (!items) {
      const aimKcal = Math.round(targetKcal + clamp(carry.kcal, targetKcal * 0.1));
      const aim: MacroGoal = {
        protein: Math.round(goal.protein + clamp(carry.p, goal.protein * 0.15)),
        fat: Math.round(goal.fat + clamp(carry.f, goal.fat * 0.15)),
        carbs: Math.round(goal.carbs + clamp(carry.c, goal.carbs * 0.15)),
      };
      items = buildDay(day, meals, pool, aimKcal, aim);
      cache.set(key, items);
    }
    const t = sumOf(items.map(m => m.dish));
    carry = { kcal: carry.kcal + targetKcal - t.kcal, p: carry.p + goal.protein - t.p, f: carry.f + goal.fat - t.f, c: carry.c + goal.carbs - t.c };
    result = items;
  }
  return result;
}

/** One day on its own (no memory of the days before it). */
function buildDay(date: Date, meals: number, pool: Dish[], targetKcal?: number, goal?: MacroGoal): MenuItem[] {
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
      const fixed = sumOf(picks.filter((d): d is Dish => Boolean(d)));
      let best: Dish[] | null = null;
      let bestCost = Infinity;
      const cur: Dish[] = [];
      const walk = (k: number, sum: { kcal: number; p: number; f: number; c: number }, rank: number) => {
        if (k === lists.length) {
          const dupes = cur.filter((d, x) => used.has(d.id) || cur.findIndex(y => y.id === d.id) !== x).length;
          const cost = (targetKcal ? dayCost(sum, targetKcal, goal) : 0) + dupes * 80 + rank * 0.01;
          if (cost < bestCost) { bestCost = cost; best = [...cur]; }
          return;
        }
        lists[k].forEach((d, idx) => {
          cur[k] = d;
          walk(k + 1, { kcal: sum.kcal + d.macros.calories, p: sum.p + d.macros.protein, f: sum.f + d.macros.fat, c: sum.c + d.macros.carbs }, rank + idx);
        });
      };
      walk(0, fixed, 0);
      (best as Dish[] | null)?.forEach((d, k) => { picks[open[k]] = d; });
    }
  }

  // 3) a day that is far from the ration's calories (or from the customer's protein): swap dishes
  //    (same kind of meal, repeats allowed) for the ones that bring it closer. Days that are close
  //    enough keep the admin's weekly plan untouched.
  if (targetKcal && picks.every(Boolean)) {
    for (let step = 0; step < 8; step++) {
      const t = sumOf(picks as Dish[]);
      if (dayOk(t, targetKcal, goal)) break;
      const miss = dayCost(t, targetKcal, goal);
      let gain = 0;
      let at = -1;
      let swap: Dish | null = null;
      plan.forEach((slot, i) => {
        for (const d of candidatesFor(slot, pool)) {
          if (picks.some(p => p!.id === d.id)) continue;
          const old = picks[i]!.macros;
          const g = miss - dayCost(
            { kcal: t.kcal - old.calories + d.macros.calories, p: t.p - old.protein + d.macros.protein, f: t.f - old.fat + d.macros.fat, c: t.c - old.carbs + d.macros.carbs },
            targetKcal,
            goal
          );
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
