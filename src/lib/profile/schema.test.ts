import { describe, expect, it } from 'vitest';
import { areDaySlotsValid, wizardDefaults, wizardFormSchema } from '@/lib/profile/schema';
import { resolveProfileTheme } from '@/lib/profile/theme';

describe('areDaySlotsValid', () => {
  it('accepte un jour fermé, un créneau ou une journée avec pause', () => {
    expect(areDaySlotsValid([])).toBe(true);
    expect(areDaySlotsValid([['09:00', '19:00']])).toBe(true);
    expect(
      areDaySlotsValid([
        ['09:00', '13:00'],
        ['15:00', '19:00'],
      ]),
    ).toBe(true);
  });

  it('refuse une fermeture avant l’ouverture, un chevauchement ou une heure vide', () => {
    expect(areDaySlotsValid([['19:00', '09:00']])).toBe(false);
    expect(
      areDaySlotsValid([
        ['09:00', '14:00'],
        ['13:00', '19:00'],
      ]),
    ).toBe(false);
    expect(areDaySlotsValid([['', '19:00']])).toBe(false);
  });
});

describe('wizardFormSchema hours', () => {
  const base = {
    ...wizardDefaults,
    businessNameFr: 'Atelier Nour',
    slug: 'atelier-nour',
    phone: '0612345678',
    cashConfirmed: true,
  };
  const broken = { ...wizardDefaults.hours, mon: [['19:00', '09:00']] as [string, string][] };

  it('ignore des horaires invalides quand ils sont désactivés', () => {
    expect(wizardFormSchema.safeParse({ ...base, hoursEnabled: false, hours: broken }).success).toBe(
      true,
    );
  });

  it('signale le jour fautif quand ils sont activés', () => {
    const result = wizardFormSchema.safeParse({ ...base, hoursEnabled: true, hours: broken });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.join('.') === 'hours.mon')).toBe(true);
  });
});

describe('resolveProfileTheme', () => {
  it('garde les thèmes connus et migre les anciennes valeurs', () => {
    expect(resolveProfileTheme('emeraude')).toBe('emeraude');
    expect(resolveProfileTheme('light')).toBe('ivoire');
    expect(resolveProfileTheme('classic')).toBe('noir');
    expect(resolveProfileTheme(null)).toBe('noir');
  });
});
