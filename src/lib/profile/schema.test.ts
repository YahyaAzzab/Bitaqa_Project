import { describe, expect, it } from 'vitest';
import { buildLinksPayload } from '@/lib/profile/links-payload';
import {
  areDaySlotsValid,
  DEFAULT_WEEKLY_HOURS,
  ownerProfileSchema,
  wizardDefaults,
  wizardFormSchema,
  type OwnerProfileValues,
} from '@/lib/profile/schema';
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
    ownerEmail: 'nour@exemple.ma',
  };
  const broken = { ...wizardDefaults.hours, mon: [['19:00', '09:00']] as [string, string][] };

  it('ignore des horaires invalides quand ils sont désactivés', () => {
    expect(
      wizardFormSchema.safeParse({ ...base, hoursEnabled: false, hours: broken }).success,
    ).toBe(true);
  });

  it('signale le jour fautif quand ils sont activés', () => {
    const result = wizardFormSchema.safeParse({ ...base, hoursEnabled: true, hours: broken });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.join('.') === 'hours.mon')).toBe(true);
  });
});

describe('wizardFormSchema client access', () => {
  const base = {
    ...wizardDefaults,
    businessNameFr: 'Atelier Nour',
    slug: 'atelier-nour',
    phone: '0612345678',
    cashConfirmed: true,
  };

  it('exige l’e-mail du client quand l’espace client est activé', () => {
    const result = wizardFormSchema.safeParse({ ...base, clientAccess: true, ownerEmail: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.join('.') === 'ownerEmail')).toBe(true);
  });

  it('normalise l’e-mail et accepte un profil sans espace client', () => {
    const parsed = wizardFormSchema.parse({ ...base, ownerEmail: '  Nour@Exemple.MA ' });
    expect(parsed.ownerEmail).toBe('nour@exemple.ma');
    expect(wizardFormSchema.safeParse({ ...base, clientAccess: false }).success).toBe(true);
  });
});

describe('ownerProfileSchema', () => {
  const owner: OwnerProfileValues = {
    profileId: '4f1c2e8a-9b1d-4c55-8a1e-2f5d6c7b8a90',
    businessNameFr: 'Atelier Nour',
    businessNameAr: 'أتيلييه نور',
    taglineFr: '',
    taglineAr: '',
    phone: '+212612345678',
    whatsappSame: true,
    whatsapp: '',
    email: '',
    addressFr: '',
    mapsUrl: '',
    logoUrl: null,
    hoursEnabled: false,
    hours: DEFAULT_WEEKLY_HOURS,
    theme: 'noir',
    accentColor: '#c9a96e',
    links: [{ key: 'a', type: 'instagram', value: 'https://instagram.com/nour' }],
  };

  it('accepte une page valide', () => {
    expect(ownerProfileSchema.safeParse(owner).success).toBe(true);
  });

  it('refuse les liens javascript: ou data:', () => {
    for (const value of ['javascript:alert(1)', 'data:text/html,x', 'http://site.ma']) {
      const result = ownerProfileSchema.safeParse({
        ...owner,
        links: [{ key: 'a', type: 'custom', value }],
      });
      expect(result.success).toBe(false);
    }
  });

  it('ignore les champs hors périmètre comme le slug ou le plan', () => {
    const result = ownerProfileSchema.safeParse({ ...owner, slug: 'autre', planCode: 'signature' });
    expect(result.success && 'slug' in result.data).toBe(false);
  });
});

describe('buildLinksPayload', () => {
  it('place téléphone, WhatsApp, e-mail et Maps avant les liens libres', () => {
    const payload = buildLinksPayload({
      phone: '0612345678',
      whatsappSame: true,
      email: 'contact@nour.ma',
      mapsUrl: 'https://maps.app.goo.gl/x',
      links: [{ type: 'instagram', value: 'https://instagram.com/nour', labelFr: ' ' }],
    });
    expect(payload).toEqual([
      { type: 'phone', label_fr: null, label_ar: null, value: '+212612345678' },
      { type: 'whatsapp', label_fr: null, label_ar: null, value: 'https://wa.me/212612345678' },
      { type: 'email', label_fr: null, label_ar: null, value: 'contact@nour.ma' },
      { type: 'maps', label_fr: null, label_ar: null, value: 'https://maps.app.goo.gl/x' },
      { type: 'instagram', label_fr: null, label_ar: null, value: 'https://instagram.com/nour' },
    ]);
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
