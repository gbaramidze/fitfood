import { Dish, DayOfWeek, MealType } from '@/types';
import { KitchenClient, KitchenDeliverySlot } from '@/types/kitchen';
import { dayKeyOf } from '@/lib/salesForecastHelper';
import { menuForDate } from '@/lib/rationRotation';

const WEEKDAY_KEYS: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const SLOT_ORDER: KitchenDeliverySlot[] = ['morning', 'comfort', 'evening'];

export const SLOT_LABEL_KA: Record<KitchenDeliverySlot, string> = {
  morning: 'დილა 06:30–08:30',
  comfort: 'დილა 08:30–10:30',
  evening: 'საღამო',
};

export const MEAL_LABEL_KA: Record<MealType, string> = {
  breakfast: 'საუზმე',
  snack: 'სამხარი',
  lunch: 'სადილი',
  dinner: 'ვახშამი',
  dessert: 'დესერტი',
  smoothie: 'სმუზი',
};

export interface RationDishPlan {
  dishId: string;
  name: string;
  mealType: MealType;
  image: string;
  total: number; // portions to cook = clients served that day
  byCalories: { calories: number; qty: number }[];
  clientsWithNotes: number; // clients with allergy / stop-list notes
}

export interface RationDayPlan {
  dateKey: string;
  weekday: DayOfWeek;
  clients: KitchenClient[]; // receiving a ration that day, sorted by slot then zone
  dishes: RationDishPlan[];
  byProgram: { programTitle: string; calories: number; qty: number }[];
}

/** What the board knows about boxes already sent (ticked "გაგზავნილია"). */
export interface SentLookup {
  /** how many boxes have been ticked as sent for this client, over all dates */
  count: (clientId: string) => number;
  /** was the box for this client on this day (YYYY-MM-DD) ticked as sent */
  on: (clientId: string, dateKey: string) => boolean;
}

/** Days still owed: purchased − delivered before the tablet was used − ticked on the tablet. */
export function remainingDays(c: KitchenClient, sent: SentLookup): number {
  return Math.max(0, (c.totalDays || 0) - (c.deliveredDays || 0) - sent.count(c.id));
}

/**
 * Which clients get a box on `targetDate`: active, started, and with enough paid days left
 * once the undelivered days between today and the target are accounted for.
 * Clients whose box for that very day is already ticked stay in the list (shown as sent).
 */
export function clientsForDate(
  clients: KitchenClient[],
  targetDate: Date,
  now: Date,
  sent: SentLookup
): KitchenClient[] {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const targetKey = dayKeyOf(target);

  return clients.filter(c => {
    if (c.status !== 'active') return false;
    if (c.startDate && c.startDate > targetKey) return false;
    if (sent.on(c.id, targetKey)) return true;
    let pendingBefore = 0;
    for (const d = new Date(todayStart); d < target; d.setDate(d.getDate() + 1)) {
      if (!sent.on(c.id, dayKeyOf(d))) pendingBefore++;
    }
    return remainingDays(c, sent) > pendingBefore;
  });
}

export function computeRationPlan(
  clients: KitchenClient[],
  siteDishes: Dish[],
  targetDate: Date,
  now: Date,
  sent: SentLookup
): RationDayPlan {
  const weekday = WEEKDAY_KEYS[targetDate.getDay()];
  const dateKey = dayKeyOf(targetDate);

  const slotRank = (s: KitchenDeliverySlot) => SLOT_ORDER.indexOf(s);
  const active = clientsForDate(clients, targetDate, now, sent).sort(
    (a, b) =>
      slotRank(a.deliverySlot) - slotRank(b.deliverySlot) ||
      (a.zone || '').localeCompare(b.zone || '') ||
      a.clientName.localeCompare(b.clientName)
  );

  // Every client receives the whole menu of the day; portion size follows their calorie tier.
  // (2-week cycle: the dishes of a weekday depend on which week of the cycle the date falls in.)
  const dishes: RationDishPlan[] = menuForDate(targetDate, siteDishes)
    .map(d => {
      const tiers = new Map<number, number>();
      active.forEach(c => tiers.set(c.calories, (tiers.get(c.calories) || 0) + 1));
      return {
        dishId: d.id,
        name: d.name.ka,
        mealType: d.mealType,
        image: d.image,
        total: active.length,
        byCalories: Array.from(tiers.entries())
          .map(([calories, qty]) => ({ calories, qty }))
          .sort((a, b) => a.calories - b.calories),
        clientsWithNotes: active.filter(c => (c.notes || '').trim().length > 0).length,
      };
    });

  const programs = new Map<string, { programTitle: string; calories: number; qty: number }>();
  active.forEach(c => {
    const key = `${c.programTitle}|${c.calories}`;
    const cur = programs.get(key) || { programTitle: c.programTitle, calories: c.calories, qty: 0 };
    cur.qty += 1;
    programs.set(key, cur);
  });

  return {
    dateKey,
    weekday,
    clients: active,
    dishes,
    byProgram: Array.from(programs.values()).sort((a, b) => b.qty - a.qty),
  };
}
