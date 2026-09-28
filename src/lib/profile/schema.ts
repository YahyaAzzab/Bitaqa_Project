import { z } from 'zod';
import { normalizeMoroccanPhone } from '@/lib/phone';
import { isReservedSlug, isValidSlug } from '@/lib/profile/slug';
import { THEME_IDS } from '@/lib/profile/themes';
import { isSafeProfileUrl } from '@/lib/profile/urls';
import type { LinkType } from '@/lib/supabase/database.types';

export const PLAN_PRICES = {
  essentiel: 149,
  signature: 299,
} as const;

export const ACCENT_DEFAULT = '#c9a96e';

const linkTypeSchema = z.enum([
  'phone',
  'whatsapp',
  'email',
  'website',
  'instagram',
  'facebook',
  'tiktok',
  'linkedin',
  'maps',
  'custom',
]);

const linkObjectSchema = z.object({
  type: linkTypeSchema,
  labelFr: z.string().trim().max(60).optional(),
  labelAr: z.string().trim().max(60).optional(),
  value: z.string().trim().min(1).max(500),
});

function isLinkValueSafe(link: { type: string; value: string }): boolean {
  return link.type === 'email' || link.type === 'phone' || isSafeProfileUrl(link.value);
}

const unsafeLink = { message: 'url_unsafe', path: ['value'] };

export const wizardLinkSchema = linkObjectSchema.refine(isLinkValueSafe, unsafeLink);

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const daySlotsSchema = z.array(z.tuple([z.string().max(5), z.string().max(5)])).max(2);

/** Créneaux au format HH:MM, fin après début, sans chevauchement entre deux créneaux. */
export function areDaySlotsValid(slots: readonly (readonly [string, string])[]): boolean {
  return slots.every(
    ([start, end], index) =>
      TIME_PATTERN.test(start) &&
      TIME_PATTERN.test(end) &&
      start < end &&
      (index === 0 || slots[index - 1]![1] <= start),
  );
}

export const weeklyHoursSchema = z.object({
  mon: daySlotsSchema,
  tue: daySlotsSchema,
  wed: daySlotsSchema,
  thu: daySlotsSchema,
  fri: daySlotsSchema,
  sat: daySlotsSchema,
  sun: daySlotsSchema,
});

export type WeeklyHoursInput = z.infer<typeof weeklyHoursSchema>;

export const DEFAULT_WEEKLY_HOURS: WeeklyHoursInput = {
  mon: [['09:00', '19:00']],
  tue: [['09:00', '19:00']],
  wed: [['09:00', '19:00']],
  thu: [['09:00', '19:00']],
  fri: [['09:00', '19:00']],
  sat: [['09:00', '19:00']],
  sun: [],
};

export const wizardFormObjectSchema = z.object({
  businessNameFr: z.string().trim().min(2).max(80),
  businessNameAr: z.string().trim().max(80).optional().or(z.literal('')),
  taglineFr: z.string().trim().max(120).optional().or(z.literal('')),
  taglineAr: z.string().trim().max(120).optional().or(z.literal('')),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidSlug, { message: 'slug_invalid' })
    .refine((s) => !isReservedSlug(s), { message: 'slug_reserved' }),
  phone: z
    .string()
    .trim()
    .min(1)
    .refine((v) => normalizeMoroccanPhone(v) !== null, { message: 'phone_invalid' }),
  whatsappSame: z.boolean(),
  whatsapp: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email({ message: 'email_invalid' }).optional().or(z.literal('')),
  addressFr: z.string().trim().max(200).optional().or(z.literal('')),
  mapsUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || isSafeProfileUrl(v), { message: 'url_unsafe' }),
  links: z.array(wizardLinkSchema).max(12).default([]),
  logoUrl: z.string().url().nullable().optional(),
  hoursEnabled: z.boolean().default(false),
  hours: weeklyHoursSchema.default(DEFAULT_WEEKLY_HOURS),
  theme: z.enum(THEME_IDS),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { message: 'accent_invalid' })
    .default(ACCENT_DEFAULT),
  planCode: z.enum(['essentiel', 'signature']),
  amountMad: z.coerce.number().int().min(0).max(50_000),
  cashConfirmed: z.boolean().refine((v) => v === true, { message: 'cash_required' }),
  designNotes: z.string().trim().max(500).optional().or(z.literal('')),
  defaultLang: z.enum(['fr', 'ar']).default('fr'),
  clientAccess: z.boolean().default(true),
  ownerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .email({ message: 'email_invalid' })
    .optional()
    .or(z.literal('')),
});

type ContactAndHours = {
  hoursEnabled: boolean;
  hours: WeeklyHoursInput;
  whatsappSame: boolean;
  whatsapp?: string;
};

function refineContactAndHours(data: ContactAndHours, ctx: z.RefinementCtx) {
  if (data.hoursEnabled) {
    for (const [day, slots] of Object.entries(data.hours)) {
      if (!areDaySlotsValid(slots)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'hours_invalid',
          path: ['hours', day],
        });
      }
    }
  }
  if (!data.whatsappSame) {
    const wa = data.whatsapp?.trim();
    if (!wa || normalizeMoroccanPhone(wa) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'whatsapp_invalid',
        path: ['whatsapp'],
      });
    }
  }
}

export const wizardFormSchema = wizardFormObjectSchema.superRefine((data, ctx) => {
  refineContactAndHours(data, ctx);
  if (data.clientAccess && !data.ownerEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'owner_email_required',
      path: ['ownerEmail'],
    });
  }
});

export const ownerLinkSchema = linkObjectSchema
  .extend({ key: z.string().min(1).max(64) })
  .refine(isLinkValueSafe, unsafeLink);

/** Ce que le commerçant peut modifier seul — jamais le slug, le plan, le statut ni l'échéance. */
export const ownerProfileObjectSchema = wizardFormObjectSchema
  .pick({
    businessNameFr: true,
    businessNameAr: true,
    taglineFr: true,
    taglineAr: true,
    phone: true,
    whatsappSame: true,
    whatsapp: true,
    email: true,
    addressFr: true,
    mapsUrl: true,
    logoUrl: true,
    hoursEnabled: true,
    hours: true,
    theme: true,
    accentColor: true,
  })
  .extend({
    profileId: z.string().uuid(),
    links: z.array(ownerLinkSchema).max(12),
  });

export const ownerProfileSchema = ownerProfileObjectSchema.superRefine(refineContactAndHours);

export type OwnerProfileValues = z.infer<typeof ownerProfileObjectSchema>;
export type OwnerLink = z.infer<typeof ownerLinkSchema>;

export type WizardFormValues = z.infer<typeof wizardFormObjectSchema>;
export type WizardLink = z.infer<typeof wizardLinkSchema>;

export type WizardLinkType = Extract<
  LinkType,
  'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'website' | 'custom' | 'whatsapp'
>;

export const WIZARD_LINK_TYPES: WizardLinkType[] = [
  'instagram',
  'whatsapp',
  'facebook',
  'tiktok',
  'website',
  'custom',
];

export const wizardDefaults: WizardFormValues = {
  businessNameFr: '',
  businessNameAr: '',
  taglineFr: '',
  taglineAr: '',
  slug: '',
  phone: '',
  whatsappSame: true,
  whatsapp: '',
  email: '',
  addressFr: '',
  mapsUrl: '',
  hoursEnabled: false,
  hours: DEFAULT_WEEKLY_HOURS,
  links: [],
  logoUrl: null,
  theme: 'noir',
  accentColor: ACCENT_DEFAULT,
  planCode: 'essentiel',
  amountMad: PLAN_PRICES.essentiel,
  cashConfirmed: false,
  designNotes: '',
  defaultLang: 'fr',
  clientAccess: true,
  ownerEmail: '',
};

/** Schéma partiel par étape pour valider avant d’avancer. */
export const stepSchemas = {
  business: wizardFormObjectSchema.pick({
    businessNameFr: true,
    businessNameAr: true,
    taglineFr: true,
    taglineAr: true,
    slug: true,
  }),
  contact: wizardFormObjectSchema.pick({
    phone: true,
    whatsappSame: true,
    whatsapp: true,
    email: true,
    addressFr: true,
    mapsUrl: true,
    hoursEnabled: true,
    hours: true,
    clientAccess: true,
    ownerEmail: true,
  }),
  links: wizardFormObjectSchema.pick({ links: true }),
  identity: wizardFormObjectSchema.pick({
    logoUrl: true,
    theme: true,
    accentColor: true,
  }),
  plan: wizardFormObjectSchema.pick({
    planCode: true,
    amountMad: true,
    cashConfirmed: true,
    designNotes: true,
  }),
} as const;

export type WizardStep = keyof typeof stepSchemas;
