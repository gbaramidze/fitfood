import { PartnerSale } from '@/types/partner';
import { PartnerPoint } from '@/types/partner';
import { PartnerPreorder } from '@/types/partner';
import { AdminDish } from '@/types/admin';
import { COOK_CATEGORIES, isCookItem } from '@/lib/cookCommissionHelper';

// Drinks aren't "prepared" the way kitchen dishes are, so they're left out of the prep plan.
const FORECAST_EXCLUDED_CATEGORIES = ['drinks'];

export type TrendDirection = 'growth' | 'decline' | 'stable';
export type ForecastConfidence = 'high' | 'medium' | 'low';

export interface ForecastItem {
  key: string;
  productId?: string;
  productName: string;
  categoryIcon: string;
  avgQuantity: number;
  recommendedQuantity: number;
  preorderQuantity: number; // confirmed, paid-in-advance preorders for the target date
  trend: TrendDirection;
  trendPercent: number;
  dataPoints: number;
  confidence: ForecastConfidence;
}

export interface PointForecast {
  pointId: string;
  pointName: string;
  pointAddress?: string;
  items: ForecastItem[];
  totalRecommendedUnits: number; // organic forecast only
  totalPreorderUnits: number;
  totalUnitsToPrepare: number; // totalRecommendedUnits + totalPreorderUnits
  usingFallback: boolean;
  dataPointsUsed: number;
}

export interface SalesForecastResult {
  targetDate: Date;
  weekdayLabel: string;
  points: PointForecast[];
}

const WEEKDAY_LABELS_KA = ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი'];

// How many past occurrences of the same weekday to look at, at most.
const MAX_WEEKDAY_SAMPLES = 8;
// How many days back to fall back to when there isn't enough same-weekday history.
const FALLBACK_LOOKBACK_DAYS = 30;

// Local calendar day (not toISOString, which is UTC and misfiles late-night local sales into the wrong day).
export function dayKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function resolveItemIcon(productId: string | undefined, productName: string, dishes: AdminDish[]): string {
  const nameNorm = (productName || '').trim().toLowerCase();
  const dish = dishes.find(d =>
    (productId && d.id === productId) ||
    (typeof d.name === 'object' && (
      (d.name.ka && d.name.ka.trim().toLowerCase() === nameNorm) ||
      (d.name.ru && d.name.ru.trim().toLowerCase() === nameNorm) ||
      (d.name.en && d.name.en.trim().toLowerCase() === nameNorm)
    ))
  );
  const catInfo = dish ? COOK_CATEGORIES.find(c => c.id === dish.category) : undefined;
  return catInfo?.icon || '🍽️';
}

export function getTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * For a target date, estimates what quantity of each product should be prepared
 * at each active point, based on historical sales on the same weekday (with a
 * recent-vs-older trend adjustment), falling back to recent overall averages
 * when there isn't enough same-weekday history yet.
 */
export function computeSalesForecast(
  sales: PartnerSale[],
  points: PartnerPoint[],
  dishes: AdminDish[],
  targetDate: Date = getTomorrow(),
  preorders: PartnerPreorder[] = []
): SalesForecastResult {
  const targetWeekday = targetDate.getDay();
  const weekdayLabel = WEEKDAY_LABELS_KA[targetWeekday];
  const targetDateKey = dayKeyOf(targetDate);

  const completedSales = sales.filter(s => s.status === 'completed' && Array.isArray(s.items));
  const activePoints = points.filter(p => p.status === 'active');

  // Confirmed, paid-in-advance preorders due for pickup on the target date, grouped by point then product key.
  const preordersByPoint: Record<string, Record<string, { qty: number; productName: string; productId?: string }>> = {};
  preorders
    .filter(p => p.status === 'pending' && p.pickupDate === targetDateKey)
    .forEach(p => {
      if (!preordersByPoint[p.pointId]) preordersByPoint[p.pointId] = {};
      p.items.forEach(it => {
        const key = it.productId || (it.productName || '').trim().toLowerCase();
        if (!key) return;
        if (!preordersByPoint[p.pointId][key]) {
          preordersByPoint[p.pointId][key] = { qty: 0, productName: it.productName || 'უცნობი პოზიცია', productId: it.productId };
        }
        preordersByPoint[p.pointId][key].qty += Number(it.quantity) || 0;
      });
    });

  const pointForecasts: PointForecast[] = activePoints.map(point => {
    const pointSales = completedSales.filter(s => s.pointId === point.id);

    // dayKey -> productKey -> { qty, productName, productId }
    const dayBuckets: Record<string, Record<string, { qty: number; productName: string; productId?: string }>> = {};
    const weekdayDayKeys: string[] = [];

    pointSales.forEach(s => {
      const d = new Date(s.createdAt);
      if (isNaN(d.getTime())) return;
      const dk = dayKeyOf(d);

      if (!dayBuckets[dk]) dayBuckets[dk] = {};
      if (d.getDay() === targetWeekday && !weekdayDayKeys.includes(dk)) {
        weekdayDayKeys.push(dk);
      }

      s.items.forEach(it => {
        const productName = (it.productName || '').trim();
        if (!productName && !it.productId) return;
        if (!isCookItem({ productId: it.productId, productName }, dishes, FORECAST_EXCLUDED_CATEGORIES)) return;
        const key = it.productId || productName.toLowerCase();
        if (!dayBuckets[dk][key]) {
          dayBuckets[dk][key] = { qty: 0, productName: productName || 'უცნობი პოზიცია', productId: it.productId };
        }
        dayBuckets[dk][key].qty += Number(it.quantity) || 0;
      });
    });

    weekdayDayKeys.sort((a, b) => b.localeCompare(a));
    const sameWeekdayKeys = weekdayDayKeys.slice(0, MAX_WEEKDAY_SAMPLES);

    const usingFallback = sameWeekdayKeys.length < 2;
    const allDayKeysSorted = Object.keys(dayBuckets).sort((a, b) => b.localeCompare(a));
    const relevantDayKeys = usingFallback
      ? allDayKeysSorted.slice(0, FALLBACK_LOOKBACK_DAYS)
      : sameWeekdayKeys;

    const productKeys = new Set<string>();
    relevantDayKeys.forEach(dk => Object.keys(dayBuckets[dk]).forEach(k => productKeys.add(k)));

    const items: ForecastItem[] = [];

    productKeys.forEach(key => {
      const series = relevantDayKeys.map(dk => dayBuckets[dk][key]?.qty || 0);
      if (series.every(q => q === 0)) return;

      const sample = relevantDayKeys.map(dk => dayBuckets[dk][key]).find(Boolean);
      if (!sample) return;

      const avgQty = series.reduce((a, b) => a + b, 0) / series.length;

      const half = Math.max(1, Math.floor(series.length / 2));
      const recent = series.slice(0, half);
      const older = series.slice(half);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;

      let trendPercent = 0;
      let trend: TrendDirection = 'stable';
      if (olderAvg > 0) {
        trendPercent = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
        if (trendPercent >= 10) trend = 'growth';
        else if (trendPercent <= -10) trend = 'decline';
      }

      // Nudge the recommendation toward the recent trend, but damp it so one
      // outlier day can't swing the plan too far.
      const trendFactor = 1 + Math.max(-0.3, Math.min(0.4, (trendPercent / 100) * 0.6));
      const recommendedQuantity = Math.max(1, Math.ceil(avgQty * trendFactor));

      const confidence: ForecastConfidence = usingFallback
        ? 'low'
        : series.length >= 4 ? 'high' : 'medium';

      items.push({
        key,
        productId: sample.productId,
        productName: sample.productName,
        categoryIcon: resolveItemIcon(sample.productId, sample.productName, dishes),
        avgQuantity: Math.round(avgQty * 10) / 10,
        recommendedQuantity,
        preorderQuantity: 0,
        trend,
        trendPercent,
        dataPoints: series.filter(q => q > 0).length,
        confidence,
      });
    });

    // Fold in confirmed preorders due on the target date: add to matching items,
    // and surface any preordered product that has no organic sales history yet.
    const pointPreorders = preordersByPoint[point.id];
    if (pointPreorders) {
      Object.entries(pointPreorders).forEach(([key, po]) => {
        const existing = items.find(i => i.key === key);
        if (existing) {
          existing.preorderQuantity += po.qty;
        } else {
          items.push({
            key,
            productId: po.productId,
            productName: po.productName,
            categoryIcon: resolveItemIcon(po.productId, po.productName, dishes),
            avgQuantity: 0,
            recommendedQuantity: 0,
            preorderQuantity: po.qty,
            trend: 'stable',
            trendPercent: 0,
            dataPoints: 0,
            confidence: 'high',
          });
        }
      });
    }

    items.sort((a, b) => (b.recommendedQuantity + b.preorderQuantity) - (a.recommendedQuantity + a.preorderQuantity));

    const totalRecommendedUnits = items.reduce((sum, i) => sum + i.recommendedQuantity, 0);
    const totalPreorderUnits = items.reduce((sum, i) => sum + i.preorderQuantity, 0);

    return {
      pointId: point.id,
      pointName: point.name.ka,
      pointAddress: point.address?.ka,
      items,
      totalRecommendedUnits,
      totalPreorderUnits,
      totalUnitsToPrepare: totalRecommendedUnits + totalPreorderUnits,
      usingFallback,
      dataPointsUsed: relevantDayKeys.length,
    };
  });

  return { targetDate, weekdayLabel, points: pointForecasts };
}
