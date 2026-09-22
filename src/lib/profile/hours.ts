/** Horaires d’ouverture — fuseau Africa/Casablanca. */

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type DaySlots = [string, string][];

export type WeeklyHours = Partial<Record<DayKey, DaySlots>>;

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const MOROCCO_TZ = 'Africa/Casablanca';

function parseHm(hm: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Jour de la semaine (0=dimanche) et minutes depuis minuit à Casablanca. */
export function moroccoNowParts(now: Date = new Date()): { dayIndex: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MOROCCO_TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return { dayIndex: map[weekday] ?? 1, minutes: hour * 60 + minute };
}

export function dayKeyFromIndex(dayIndex: number): DayKey {
  return DAY_KEYS[dayIndex] ?? 'mon';
}

export function isOpenNow(hours: WeeklyHours | null | undefined, now: Date = new Date()): boolean {
  if (!hours) return false;
  const { dayIndex, minutes } = moroccoNowParts(now);
  const key = dayKeyFromIndex(dayIndex);
  const slots = hours[key] ?? [];
  for (const slot of slots) {
    const start = parseHm(slot[0]);
    const end = parseHm(slot[1]);
    if (start === null || end === null) continue;
    if (minutes >= start && minutes < end) return true;
  }
  return false;
}

export function parseHoursJson(raw: unknown): WeeklyHours | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out: WeeklyHours = {};
  for (const key of Object.keys(raw) as DayKey[]) {
    if (!DAY_KEYS.includes(key) && !['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(key)) {
      continue;
    }
    const value = (raw as Record<string, unknown>)[key];
    if (!Array.isArray(value)) continue;
    const slots: DaySlots = [];
    for (const item of value) {
      if (
        Array.isArray(item) &&
        item.length >= 2 &&
        typeof item[0] === 'string' &&
        typeof item[1] === 'string'
      ) {
        slots.push([item[0], item[1]]);
      }
    }
    out[key] = slots;
  }
  return out;
}
