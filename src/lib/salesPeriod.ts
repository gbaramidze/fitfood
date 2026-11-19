export type SalesPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'custom' | 'all';

export interface SalesDateRange {
  /** ISO timestamp, inclusive. null = no lower bound */
  from: string | null;
  /** ISO timestamp, exclusive. null = no upper bound */
  to: string | null;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Parses 'YYYY-MM-DD' as a LOCAL date (new Date('YYYY-MM-DD') would be UTC). */
function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Converts a period selector into the [from, to) range sent to the server (local-time boundaries). */
export function getSalesDateRange(
  period: SalesPeriod,
  customStart?: string,
  customEnd?: string,
  now: Date = new Date()
): SalesDateRange {
  const today = startOfDay(now);

  switch (period) {
    case 'today':
      return { from: today.toISOString(), to: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString() };
    case 'yesterday':
      return { from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString(), to: today.toISOString() };
    case 'week':
      return { from: new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString(), to: null };
    case 'month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      };
    case 'last_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        to: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      };
    case 'custom': {
      const start = customStart ? parseLocalDate(customStart) : null;
      const end = customEnd ? parseLocalDate(customEnd) : null;
      return {
        from: start ? start.toISOString() : null,
        to: end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).toISOString() : null,
      };
    }
    default:
      return { from: null, to: null };
  }
}
