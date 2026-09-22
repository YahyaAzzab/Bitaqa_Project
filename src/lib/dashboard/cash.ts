/** Agrégations caisse — fuseau métier Maroc. */
export const CASH_TIMEZONE = 'Africa/Casablanca';

export type SaleAmountRow = {
  amount_mad: number;
  collected_at: string;
};

export type PeriodTotals = {
  today: number;
  week: number;
  month: number;
};

export type DailyTotal = {
  /** YYYY-MM-DD en fuseau Casablanca */
  date: string;
  total: number;
};

export type PeriodBounds = {
  todayStart: Date;
  weekStart: Date;
  monthStart: Date;
  /** Début de la fenêtre des 30 derniers jours (inclus) */
  last30Start: Date;
};

/** Jour civil YYYY-MM-DD dans le fuseau donné. */
export function dateKeyInTz(date: Date, timeZone = CASH_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Minuit local Casablanca pour une date YYYY-MM-DD.
 * Le Maroc est en UTC+1 toute l’année depuis 2018.
 */
export function casablancaMidnight(ymd: string): Date {
  return new Date(`${ymd}T00:00:00+01:00`);
}

function addCalendarDays(ymd: string, days: number): string {
  const base = casablancaMidnight(ymd);
  const next = new Date(base.getTime() + days * 86_400_000);
  return dateKeyInTz(next);
}

/** Lundi de la semaine civile contenant `ymd`. */
function mondayOfWeek(ymd: string): string {
  const noon = new Date(`${ymd}T12:00:00+01:00`);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: CASH_TIMEZONE,
    weekday: 'short',
  }).format(noon);
  const offset: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const back = offset[weekday] ?? 0;
  return addCalendarDays(ymd, -back);
}

export function getPeriodBounds(now = new Date()): PeriodBounds {
  const todayKey = dateKeyInTz(now);
  const todayStart = casablancaMidnight(todayKey);
  const weekStart = casablancaMidnight(mondayOfWeek(todayKey));
  const monthStart = casablancaMidnight(`${todayKey.slice(0, 7)}-01`);
  const last30Start = casablancaMidnight(addCalendarDays(todayKey, -29));
  return { todayStart, weekStart, monthStart, last30Start };
}

export function sumSalesSince(
  sales: ReadonlyArray<SaleAmountRow>,
  since: Date,
  untilExclusive?: Date,
): number {
  const from = since.getTime();
  const to = untilExclusive?.getTime();
  let sum = 0;
  for (const sale of sales) {
    const t = new Date(sale.collected_at).getTime();
    if (Number.isNaN(t) || t < from) continue;
    if (to !== undefined && t >= to) continue;
    sum += sale.amount_mad;
  }
  return sum;
}

export function computePeriodTotals(
  sales: ReadonlyArray<SaleAmountRow>,
  now = new Date(),
): PeriodTotals {
  const { todayStart, weekStart, monthStart } = getPeriodBounds(now);
  return {
    today: sumSalesSince(sales, todayStart),
    week: sumSalesSince(sales, weekStart),
    month: sumSalesSince(sales, monthStart),
  };
}

/** Totaux journaliers sur `days` jours glissants (Casablanca), jours vides inclus. */
export function groupSalesByDay(
  sales: ReadonlyArray<SaleAmountRow>,
  days = 30,
  now = new Date(),
): DailyTotal[] {
  const todayKey = dateKeyInTz(now);
  const startKey = addCalendarDays(todayKey, -(days - 1));
  const map = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    map.set(addCalendarDays(startKey, i), 0);
  }
  for (const sale of sales) {
    const key = dateKeyInTz(new Date(sale.collected_at));
    if (!map.has(key)) continue;
    map.set(key, (map.get(key) ?? 0) + sale.amount_mad);
  }
  return [...map.entries()].map(([date, total]) => ({ date, total }));
}
