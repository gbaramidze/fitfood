import { PartnerSale, PartnerSaleItem, PartnerPoint } from '@/types/partner';
import { AdminDish } from '@/types/admin';

export interface DishDailySales {
  dateKey: string; // YYYY-MM-DD
  date: Date;
  quantity: number;
  revenue: number;
}

export interface DishSalesSummary {
  totalQuantity: number;
  totalRevenue: number;
  avgPerDay: number;
  daysInRange: number;
  daysWithSales: number;
}

export interface DishSalesByPoint {
  pointId: string;
  pointName: string;
  quantity: number;
  revenue: number;
  sharePercent: number;
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface DishTrend {
  direction: TrendDirection;
  percent: number;
  hasData: boolean;
}

// Local calendar day (not toISOString, which is UTC and misfiles late-night local sales into the wrong day).
function dayKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Matches a sold line item to a specific dish, by id first, then by normalized name in any language. */
export function itemMatchesDish(it: { productId?: string; productName?: string }, dish: AdminDish): boolean {
  if (it.productId && it.productId === dish.id) return true;
  const nameNorm = (it.productName || '').trim().toLowerCase();
  if (!nameNorm) return false;
  return Boolean(
    (dish.name?.ka && dish.name.ka.trim().toLowerCase() === nameNorm) ||
    (dish.name?.ru && dish.name.ru.trim().toLowerCase() === nameNorm) ||
    (dish.name?.en && dish.name.en.trim().toLowerCase() === nameNorm)
  );
}

function matchingItems(sale: PartnerSale, dish: AdminDish): PartnerSaleItem[] {
  if (!Array.isArray(sale.items)) return [];
  return sale.items.filter(it => itemMatchesDish(it, dish));
}

/**
 * Builds a continuous daily series (zero-filled) of quantity sold and revenue
 * for one dish between startDate and endDate (inclusive, local calendar days).
 */
export function computeDishDailySales(
  sales: PartnerSale[],
  dish: AdminDish,
  startDate: Date,
  endDate: Date
): DishDailySales[] {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const byDay: Record<string, { quantity: number; revenue: number }> = {};

  sales.forEach(sale => {
    if (sale.status !== 'completed') return;
    const d = new Date(sale.createdAt);
    if (isNaN(d.getTime())) return;
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    if (dayStart < start || dayStart > end) return;

    const items = matchingItems(sale, dish);
    if (items.length === 0) return;

    const dk = dayKeyOf(d);
    if (!byDay[dk]) byDay[dk] = { quantity: 0, revenue: 0 };

    items.forEach(it => {
      const qty = Number(it.quantity) || 0;
      const revenue = Number(it.totalPrice) || ((Number(it.pricePerUnit) || 0) * qty);
      byDay[dk].quantity += qty;
      byDay[dk].revenue += revenue;
    });
  });

  const series: DishDailySales[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const dk = dayKeyOf(cursor);
    const entry = byDay[dk];
    series.push({
      dateKey: dk,
      date: new Date(cursor),
      quantity: entry?.quantity || 0,
      revenue: entry?.revenue || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
}

export function summarizeDishSales(series: DishDailySales[]): DishSalesSummary {
  const totalQuantity = series.reduce((sum, d) => sum + d.quantity, 0);
  const totalRevenue = series.reduce((sum, d) => sum + d.revenue, 0);
  const daysWithSales = series.filter(d => d.quantity > 0).length;

  return {
    totalQuantity,
    totalRevenue,
    avgPerDay: series.length > 0 ? totalQuantity / series.length : 0,
    daysInRange: series.length,
    daysWithSales,
  };
}

/**
 * Breaks down how much of one dish sold at each point (gym/location) within a
 * date range, sorted by quantity descending.
 */
export function computeDishSalesByPoint(
  sales: PartnerSale[],
  points: PartnerPoint[],
  dish: AdminDish,
  startDate: Date,
  endDate: Date
): DishSalesByPoint[] {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const byPoint: Record<string, { quantity: number; revenue: number }> = {};

  sales.forEach(sale => {
    if (sale.status !== 'completed') return;
    const d = new Date(sale.createdAt);
    if (isNaN(d.getTime())) return;
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    if (dayStart < start || dayStart > end) return;

    const items = matchingItems(sale, dish);
    if (items.length === 0) return;

    if (!byPoint[sale.pointId]) byPoint[sale.pointId] = { quantity: 0, revenue: 0 };
    items.forEach(it => {
      const qty = Number(it.quantity) || 0;
      const revenue = Number(it.totalPrice) || ((Number(it.pricePerUnit) || 0) * qty);
      byPoint[sale.pointId].quantity += qty;
      byPoint[sale.pointId].revenue += revenue;
    });
  });

  const totalQuantity = Object.values(byPoint).reduce((sum, p) => sum + p.quantity, 0);

  return Object.entries(byPoint)
    .map(([pointId, data]) => {
      const point = points.find(p => p.id === pointId);
      return {
        pointId,
        pointName: point?.name?.ka || pointId,
        quantity: data.quantity,
        revenue: data.revenue,
        sharePercent: totalQuantity > 0 ? Math.round((data.quantity / totalQuantity) * 100) : 0,
      };
    })
    .sort((a, b) => b.quantity - a.quantity);
}

/**
 * Quick recent-vs-previous window comparison, used for the at-a-glance trend
 * arrow shown next to a dish in the list (independent of the modal's own range).
 */
export function computeDishTrend(sales: PartnerSale[], dish: AdminDish, windowDays = 7): DishTrend {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recentStart = new Date(today);
  recentStart.setDate(recentStart.getDate() - (windowDays - 1));

  const previousEnd = new Date(recentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - (windowDays - 1));

  const recentSeries = computeDishDailySales(sales, dish, recentStart, today);
  const previousSeries = computeDishDailySales(sales, dish, previousStart, previousEnd);

  const recentTotal = recentSeries.reduce((sum, d) => sum + d.quantity, 0);
  const previousTotal = previousSeries.reduce((sum, d) => sum + d.quantity, 0);

  if (recentTotal === 0 && previousTotal === 0) {
    return { direction: 'flat', percent: 0, hasData: false };
  }

  if (previousTotal === 0) {
    return { direction: 'up', percent: 100, hasData: true };
  }

  const percent = Math.round(((recentTotal - previousTotal) / previousTotal) * 100);
  if (percent >= 10) return { direction: 'up', percent, hasData: true };
  if (percent <= -10) return { direction: 'down', percent, hasData: true };
  return { direction: 'flat', percent, hasData: true };
}
