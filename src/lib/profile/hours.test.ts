import { describe, expect, it } from 'vitest';
import { isOpenNow, parseHoursJson, type WeeklyHours } from '@/lib/profile/hours';

const hours: WeeklyHours = {
  mon: [['09:00', '18:00']],
  tue: [['09:00', '18:00']],
  wed: [],
  thu: [['10:00', '14:00'], ['16:00', '20:00']],
  fri: [['09:00', '18:00']],
  sat: [['10:00', '14:00']],
  sun: [],
};

describe('parseHoursJson', () => {
  it('parse un objet d’horaires', () => {
    const parsed = parseHoursJson(hours);
    expect(parsed?.mon?.[0]).toEqual(['09:00', '18:00']);
    expect(parsed?.wed).toEqual([]);
  });

  it('refuse les valeurs invalides', () => {
    expect(parseHoursJson(null)).toBeNull();
    expect(parseHoursJson('x')).toBeNull();
  });
});

describe('isOpenNow', () => {
  it('détecte ouvert / fermé sur un créneau', () => {
    // Jeudi 11:00 Casablanca ≈ UTC+1 ou +0 selon DST — on fixe via Date UTC
    // On teste la logique avec un mock de date : 2024-01-04 est un jeudi.
    const thursdayMorning = new Date('2024-01-04T10:30:00+01:00');
    expect(isOpenNow(hours, thursdayMorning)).toBe(true);

    const thursdayGap = new Date('2024-01-04T15:00:00+01:00');
    expect(isOpenNow(hours, thursdayGap)).toBe(false);

    const wednesday = new Date('2024-01-03T12:00:00+01:00');
    expect(isOpenNow(hours, wednesday)).toBe(false);
  });
});
