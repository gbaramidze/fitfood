import { PartnerSale, PartnerPoint, PartnerPreorder, PartnerWriteOff } from '@/types/partner';
import { AdminDish } from '@/types/admin';
import { COOK_CATEGORIES, isCookItem } from '@/lib/cookCommissionHelper';
import {
  computeSalesForecast,
  dayKeyOf,
  ForecastConfidence,
  SalesForecastResult,
  TrendDirection,
} from '@/lib/salesForecastHelper';

/**
 * Kitchen prep plan = the admin sales forecast, made aware of what is actually
 * on the hall shelves and of what has been spoiling.
 *
 *   toPrepare = adjustedDemand(target day) + preorders(target day) − carryOver
 *
 *   carryOver   = shelf stock now − (what will still sell today + today's pending preorders)
 *               − (forecast of any days in between)
 *   adjustedDemand = forecast × spoilageFactor
 *
 * Example: tomorrow's forecast is 10 burritos, at 18:00 8 are on the shelf and ~4 more
 * will sell today → carryOver = 4 → prepare 6, not 10.
 */

const EXCLUDED_CATEGORIES = ['drinks'];

/** Write-off reasons that mean "we made / shipped more than the hall could sell". */
const WASTE_REASONS = ['expired', 'kitchen_waste'];
const WASTE_WINDOW_DAYS = 14;
const SPOIL_DAYS_WINDOW = 7;
const HISTORY_WINDOW_DAYS = 28;

/** Default shop hours, used until there is enough sales history to learn the real daily curve. */
const DEFAULT_OPEN_MIN = 9 * 60;
const DEFAULT_CLOSE_MIN = 22 * 60;
const MIN_UNITS_FOR_PROFILE = 20;
/** Before this share of the day has passed, today's pace is too noisy to extrapolate. */
const MIN_SHARE_FOR_PACE = 0.35;
/** After this share of the day, a product with zero sales today counts as a missed day. */
const SHARE_FOR_MISSED_TODAY = 0.7;

export type SpoilLevel = 'none' | 'watch' | 'high' | 'stale';

export interface SpoilageInfo {
  level: SpoilLevel;
  wastedUnits: number; // expired / kitchen waste in the last 14 days
  soldUnits: number; // sold in the last 14 days
  wasteRatio: number; // wasted / (wasted + sold)
  spoilDays: number; // distinct days with spoilage in the last 7 days
  unsoldStreak: number; // consecutive trading days without a sale while on the shelf
  factor: number; // multiplier applied to the forecast, 0..1
  reasons: string[];
}

export interface KitchenItem {
  key: string;
  productId?: string;
  productName: string;
  categoryId: string;
  categoryIcon: string;

  stockNow: number;
  soldToday: number;
  expectedRemainingToday: number; // still expected to sell today (organic)
  todayPreorders: number; // pending preorders due today (reserve stock)
  carryOver: number; // stock that will still be there at the start of the target day

  rawForecast: number; // admin-style forecast before spoilage adjustment
  adjustedForecast: number; // after spoilage adjustment
  preorderQty: number; // confirmed preorders for the target day
  toPrepare: number;

  trend: TrendDirection;
  trendPercent: number;
  confidence: ForecastConfidence;
  dataPoints: number;
  spoilage: SpoilageInfo;
}

export interface HallPlan {
  pointId: string;
  pointName: string;
  pointAddress?: string;
  items: KitchenItem[];
  totalToPrepare: number;
  totalStock: number;
  riskItems: number; // items with spoilage level high / stale
}

export interface CookTotal {
  key: string;
  productId?: string;
  productName: string;
  categoryId: string;
  categoryIcon: string;
  total: number;
  halls: { pointId: string; pointName: string; qty: number; demand: number; carry: number }[];
}

export interface KitchenPlan {
  now: Date;
  targetDate: Date;
  targetDateKey: string;
  weekdayLabel: string;
  daysAhead: number;
  dayShare: number; // share of today's sales expected to be done by now (0..1)
  halls: HallPlan[];
  cookTotals: CookTotal[];
  totalToPrepare: number;
}

// ---------------------------------------------------------------------------

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function findDish(productId: string | undefined, name: string, dishes: AdminDish[]): AdminDish | undefined {
  const n = (name || '').trim().toLowerCase();
  return dishes.find(
    d =>
      (productId && d.id === productId) ||
      (n &&
        typeof d.name === 'object' &&
        ((d.name.ka && d.name.ka.trim().toLowerCase() === n) ||
          (d.name.ru && d.name.ru.trim().toLowerCase() === n) ||
          (d.name.en && d.name.en.trim().toLowerCase() === n)))
  );
}

/** Same key the sales forecast uses, so forecast rows, stock rows and write-offs all line up. */
function canonicalKey(productId: string | undefined, name: string, dishes: AdminDish[]): string {
  if (productId) return productId;
  const dish = findDish(undefined, name, dishes);
  return dish ? dish.id : (name || '').trim().toLowerCase();
}

function categoryOf(dish: AdminDish | undefined): { id: string; icon: string } {
  const id = dish?.category || 'other';
  const info = COOK_CATEGORIES.find(c => c.id === id);
  return { id, icon: info?.icon || '🍽️' };
}

/**
 * Share of a day's units that are normally sold by `now`, learned from the last 4 weeks of
 * sales at this point (or all points when this one is new). Falls back to a straight line
 * across default shop hours.
 */
function soldShareByNow(sales: PartnerSale[], now: Date, dishes: AdminDish[]): number {
  let total = 0;
  let before = 0;
  const nowMin = minutesOfDay(now);
  sales.forEach(s => {
    const d = new Date(s.createdAt);
    if (isNaN(d.getTime())) return;
    s.items.forEach(it => {
      if (!isCookItem({ productId: it.productId, productName: it.productName || '' }, dishes, EXCLUDED_CATEGORIES)) return;
      const q = Number(it.quantity) || 0;
      total += q;
      if (minutesOfDay(d) < nowMin) before += q;
    });
  });
  if (total >= MIN_UNITS_FOR_PROFILE) return Math.min(1, Math.max(0, before / total));
  const linear = (nowMin - DEFAULT_OPEN_MIN) / (DEFAULT_CLOSE_MIN - DEFAULT_OPEN_MIN);
  return Math.min(1, Math.max(0, linear));
}

interface ProductHistory {
  /** units sold per trading day (YYYY-MM-DD → qty), history before today */
  daily: Record<string, number>;
  soldToday: number;
  name: string;
  productId?: string;
}

export interface KitchenPlanInput {
  sales: PartnerSale[];
  points: PartnerPoint[];
  dishes: AdminDish[];
  preorders: PartnerPreorder[];
  writeOffs: PartnerWriteOff[];
  stocks: Record<string, Record<string, number>>;
  targetDate: Date;
  now?: Date;
}

export function computeKitchenPlan(input: KitchenPlanInput): KitchenPlan {
  const { points, dishes, preorders, writeOffs, stocks } = input;
  const now = input.now ?? new Date();
  const todayStart = startOfDay(now);
  const targetStart = startOfDay(input.targetDate);
  const daysAhead = Math.max(0, Math.round((targetStart.getTime() - todayStart.getTime()) / 86400000));
  const histFrom = addDays(todayStart, -HISTORY_WINDOW_DAYS);

  const completed = input.sales.filter(s => s.status === 'completed' && Array.isArray(s.items));

  // Forecast history must not include today's partial day, otherwise today's low morning
  // sales would drag every forecast down.
  const historySales = completed.filter(s => {
    const t = new Date(s.createdAt).getTime();
    return !isNaN(t) && t < todayStart.getTime();
  });
  const todaySales = completed.filter(s => {
    const t = new Date(s.createdAt).getTime();
    return !isNaN(t) && t >= todayStart.getTime() && t <= now.getTime();
  });

  const forecastCache = new Map<string, SalesForecastResult>();
  const forecastFor = (date: Date) => {
    const k = dayKeyOf(date);
    let f = forecastCache.get(k);
    if (!f) {
      f = computeSalesForecast(historySales, points, dishes, date, preorders);
      forecastCache.set(k, f);
    }
    return f;
  };

  const todayForecast = forecastFor(todayStart);
  const targetForecast = forecastFor(targetStart);

  const activePoints = points.filter(p => p.status === 'active');
  const windowSales = historySales.filter(s => new Date(s.createdAt).getTime() >= histFrom.getTime());

  const halls: HallPlan[] = activePoints.map(point => {
    const pointHistory = windowSales.filter(s => s.pointId === point.id);
    const pointToday = todaySales.filter(s => s.pointId === point.id);

    // Learn the daily sales curve from this hall, or from everyone while the hall is new.
    const profileSales = pointHistory.length >= 5 ? pointHistory : windowSales;
    const dayShare = soldShareByNow(profileSales, now, dishes);

    // ---- per-product sales history at this hall ----
    const history: Record<string, ProductHistory> = {};
    const tradingDays = new Set<string>();

    const ingest = (s: PartnerSale, isToday: boolean) => {
      const dk = dayKeyOf(new Date(s.createdAt));
      s.items.forEach(it => {
        const name = (it.productName || '').trim();
        if (!name && !it.productId) return;
        if (!isCookItem({ productId: it.productId, productName: name }, dishes, EXCLUDED_CATEGORIES)) return;
        const key = canonicalKey(it.productId, name, dishes);
        if (!history[key]) history[key] = { daily: {}, soldToday: 0, name: name || 'უცნობი პოზიცია', productId: it.productId };
        const q = Number(it.quantity) || 0;
        if (isToday) {
          history[key].soldToday += q;
        } else {
          history[key].daily[dk] = (history[key].daily[dk] || 0) + q;
          tradingDays.add(dk);
        }
      });
      if (!isToday) tradingDays.add(dk);
    };
    pointHistory.forEach(s => ingest(s, false));
    pointToday.forEach(s => ingest(s, true));

    const openDaysDesc = Array.from(tradingDays).sort((a, b) => b.localeCompare(a));

    // ---- write-offs at this hall ----
    const wasteFrom = addDays(todayStart, -WASTE_WINDOW_DAYS).getTime();
    const spoilFrom = addDays(todayStart, -SPOIL_DAYS_WINDOW).getTime();
    const wasteByKey: Record<string, { units: number; recentDays: Set<string> }> = {};
    writeOffs.forEach(w => {
      if (w.pointId !== point.id || !WASTE_REASONS.includes(w.reason)) return;
      const t = new Date(w.createdAt).getTime();
      if (isNaN(t) || t < wasteFrom) return;
      const key = canonicalKey(w.productId, w.productName, dishes);
      if (!wasteByKey[key]) wasteByKey[key] = { units: 0, recentDays: new Set() };
      wasteByKey[key].units += Number(w.quantity) || 0;
      if (t >= spoilFrom) wasteByKey[key].recentDays.add(dayKeyOf(new Date(t)));
    });

    // ---- candidate products: forecast rows + anything physically on the shelf ----
    const pointStock = stocks[point.id] || {};
    const targetRows = targetForecast.points.find(p => p.pointId === point.id)?.items || [];
    const todayRows = todayForecast.points.find(p => p.pointId === point.id)?.items || [];

    const rowByKey = (rows: typeof targetRows) => {
      const m = new Map<string, (typeof targetRows)[number]>();
      rows.forEach(r => m.set(canonicalKey(r.productId, r.productName, dishes), r));
      return m;
    };
    const targetMap = rowByKey(targetRows);
    const todayMap = rowByKey(todayRows);

    // Intermediate days (only when planning 2+ days ahead) eat into the carry-over too.
    const betweenMaps: Map<string, (typeof targetRows)[number]>[] = [];
    for (let i = 1; i < daysAhead; i++) {
      const rows = forecastFor(addDays(todayStart, i)).points.find(p => p.pointId === point.id)?.items || [];
      betweenMaps.push(rowByKey(rows));
    }

    const keys = new Set<string>([...targetMap.keys(), ...Object.keys(history)]);
    Object.entries(pointStock).forEach(([pid, qty]) => {
      if ((Number(qty) || 0) > 0) keys.add(pid);
    });

    const items: KitchenItem[] = [];

    keys.forEach(key => {
      const dish = findDish(key, '', dishes);
      const h = history[key];
      const tRow = targetMap.get(key);
      const name =
        (dish && typeof dish.name === 'object' ? dish.name.ka : '') || tRow?.productName || h?.name || 'უცნობი პოზიცია';

      if (!isCookItem({ productId: dish?.id || key, productName: name }, dishes, EXCLUDED_CATEGORIES)) return;

      const stockNow = Math.max(0, Number(pointStock[key]) || 0);
      const soldToday = h?.soldToday || 0;

      // ---- spoilage / stale signals ----
      const waste = wasteByKey[key];
      const soldWindow = Object.entries(h?.daily || {}).reduce((sum, [dk, q]) => {
        return new Date(dk + 'T00:00:00').getTime() >= wasteFrom ? sum + q : sum;
      }, 0);
      const wastedUnits = waste?.units || 0;
      const wasteRatio = wastedUnits + soldWindow > 0 ? wastedUnits / (wastedUnits + soldWindow) : 0;
      const spoilDays = waste?.recentDays.size || 0;

      // Consecutive trading days without a sale. Only meaningful if the product is physically
      // on the shelf — with an empty shelf, "no sales" just means "sold out", not "no demand".
      const onShelf = stockNow > 0 || spoilDays > 0;
      let streak = 0;
      if (onShelf) {
        if (dayShare >= SHARE_FOR_MISSED_TODAY && soldToday === 0) streak++;
        for (const dk of openDaysDesc) {
          if ((h?.daily[dk] || 0) > 0) break;
          streak++;
          if (streak >= 7) break;
        }
        // A product that sold today is, by definition, not stale.
        if (soldToday > 0) streak = 0;
      }
      let baseline = 0;
      if (streak > 0) {
        const olderDays = openDaysDesc.slice(Math.max(0, streak - (dayShare >= SHARE_FOR_MISSED_TODAY && soldToday === 0 ? 1 : 0)));
        if (olderDays.length >= 3) {
          baseline = olderDays.reduce((sum, dk) => sum + (h?.daily[dk] || 0), 0) / olderDays.length;
        }
      }

      let factor = 1;
      const reasons: string[] = [];
      let level: SpoilLevel = 'none';

      if (wastedUnits > 0) {
        const penalty = Math.min(0.5, wasteRatio * 1.2 + 0.1 * Math.max(0, spoilDays - 1));
        if (penalty >= 0.05) {
          factor *= 1 - penalty;
          reasons.push(`ბოლო ${WASTE_WINDOW_DAYS} დღეში გაფუჭდა ${wastedUnits} ც (${Math.round(wasteRatio * 100)}%)`);
          if (spoilDays >= 2) reasons.push(`გაფუჭება ${spoilDays} სხვადასხვა დღეს ბოლო ${SPOIL_DAYS_WINDOW} დღეში`);
          level = penalty >= 0.25 ? 'high' : 'watch';
        }
      }

      // Zero sales only means something if the product normally sells: a streak is "suspicious"
      // once we would have expected at least ~2-3 units over those days.
      const usual = `ჩვეულებრივ ~${Math.round(baseline * 10) / 10} ც/დღეში`;
      if (streak >= 3 && baseline * streak >= 2.5) {
        factor = 0;
        level = 'stale';
        reasons.push(`${streak} დღეა არ გაიყიდა (${usual})`);
      } else if (streak === 2 && baseline * 2 >= 2.5) {
        factor *= 0.5;
        level = 'high';
        reasons.push(`2 დღეა არ გაიყიდა (${usual})`);
      } else if (streak === 1 && baseline >= 3) {
        factor *= 0.8;
        if (level === 'none') level = 'watch';
        reasons.push(`1 დღე არ გაიყიდა (${usual})`);
      }

      // ---- demand for the target day ----
      const todayRow = todayMap.get(key);
      const expectedToday = todayRow?.recommendedQuantity || 0;
      const todayPre = todayRow?.preorderQuantity || 0;

      // What will still sell between now and closing today. Stock only carries over if it survives
      // the rest of today, so this errs on the high side (less carry-over, more cooking):
      //  - the full day's forecast minus what is already sold, and
      //  - at least the usual evening tail (forecast × share of the day still to come), and
      //  - if today is running hotter than forecast, extrapolate today's pace instead.
      // A slow day never lowers the estimate — a slow morning can still be followed by a busy evening.
      let projectedToday = expectedToday;
      if (dayShare >= MIN_SHARE_FOR_PACE) {
        projectedToday = Math.max(expectedToday, soldToday / dayShare);
      }
      const restOfToday = Math.max(0, Math.ceil(Math.max(projectedToday - soldToday, expectedToday * (1 - dayShare))));
      const remainingToday = Math.min(stockNow, restOfToday);

      let rawForecast: number;
      let preorderQty: number;
      let carryOver: number;

      if (daysAhead === 0) {
        // Planning for the rest of today: demand is what is still expected, the shelf is what we have now.
        rawForecast = restOfToday;
        preorderQty = todayPre;
        carryOver = stockNow;
      } else {
        rawForecast = tRow?.recommendedQuantity || 0;
        preorderQty = tRow?.preorderQuantity || 0;
        let left = Math.max(0, stockNow - remainingToday - todayPre);
        betweenMaps.forEach(m => {
          left = Math.max(0, left - (m.get(key)?.recommendedQuantity || 0));
        });
        carryOver = left;
      }

      const adjustedForecast = factor <= 0 ? 0 : Math.ceil(rawForecast * factor);
      const toPrepare = Math.max(0, adjustedForecast + preorderQty - carryOver);

      if (toPrepare === 0 && stockNow === 0 && adjustedForecast === 0 && preorderQty === 0 && soldToday === 0) return;

      const cat = categoryOf(dish);

      items.push({
        key,
        productId: dish?.id || tRow?.productId || h?.productId,
        productName: name,
        categoryId: cat.id,
        categoryIcon: cat.icon,
        stockNow,
        soldToday,
        expectedRemainingToday: remainingToday,
        todayPreorders: todayPre,
        carryOver,
        rawForecast,
        adjustedForecast,
        preorderQty,
        toPrepare,
        trend: tRow?.trend || 'stable',
        trendPercent: tRow?.trendPercent || 0,
        confidence: tRow?.confidence || 'low',
        dataPoints: tRow?.dataPoints || 0,
        spoilage: {
          level,
          wastedUnits,
          soldUnits: soldWindow,
          wasteRatio,
          spoilDays,
          unsoldStreak: streak,
          factor,
          reasons,
        },
      });
    });

    items.sort((a, b) => b.toPrepare - a.toPrepare || b.stockNow - a.stockNow || a.productName.localeCompare(b.productName));

    return {
      pointId: point.id,
      pointName: point.name.ka,
      pointAddress: point.address?.ka,
      items,
      totalToPrepare: items.reduce((s, i) => s + i.toPrepare, 0),
      totalStock: items.reduce((s, i) => s + i.stockNow, 0),
      riskItems: items.filter(i => i.stockNow > 0 && (i.spoilage.level === 'high' || i.spoilage.level === 'stale')).length,
    };
  });

  // ---- what the kitchen cooks, summed over all halls ----
  const totals = new Map<string, CookTotal>();
  halls.forEach(h => {
    h.items.forEach(it => {
      if (it.toPrepare <= 0) return;
      let t = totals.get(it.key);
      if (!t) {
        t = {
          key: it.key,
          productId: it.productId,
          productName: it.productName,
          categoryId: it.categoryId,
          categoryIcon: it.categoryIcon,
          total: 0,
          halls: [],
        };
        totals.set(it.key, t);
      }
      t.total += it.toPrepare;
      t.halls.push({
        pointId: h.pointId,
        pointName: h.pointName,
        qty: it.toPrepare,
        demand: it.adjustedForecast + it.preorderQty,
        carry: it.carryOver,
      });
    });
  });

  const catOrder = COOK_CATEGORIES.map(c => c.id);
  const cookTotals = Array.from(totals.values()).sort(
    (a, b) =>
      (catOrder.indexOf(a.categoryId) === -1 ? 99 : catOrder.indexOf(a.categoryId)) -
        (catOrder.indexOf(b.categoryId) === -1 ? 99 : catOrder.indexOf(b.categoryId)) ||
      b.total - a.total
  );

  return {
    now,
    targetDate: targetStart,
    targetDateKey: dayKeyOf(targetStart),
    weekdayLabel: targetForecast.weekdayLabel,
    daysAhead,
    dayShare: halls.length ? soldShareByNow(windowSales, now, dishes) : 0,
    halls,
    cookTotals,
    totalToPrepare: cookTotals.reduce((s, t) => s + t.total, 0),
  };
}
