import { z } from 'zod';
import { normalizeMoroccanPhone } from '@/lib/phone';
import { isReservedSlug, isValidSlug } from '@/lib/profile/slug';
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

export const wizardLinkSchema = z.object({
  type: linkTypeSchema,
  labelFr: z.string().trim().max(60).optional(),
  labelAr: z.string().trim().max(60).optional(),
  value: z.string().trim().min(1).max(500),
});

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
  email: z
    .string()
    .trim()
    .email({ message: 'email_invalid' })
    .optional()
    .or(z.literal('')),
  addressFr: z.string().trim().max(200).optional().or(z.literal('')),
  mapsUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || isSafeProfileUrl(v), { message: 'url_unsafe' }),
  links: z.array(wizardLinkSchema).max(12).default([]),
  logoUrl: z.string().url().nullable().optional(),
  theme: z.enum(['noir', 'ivoire']),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { message: 'accent_invalid' })
    .default(ACCENT_DEFAULT),
  planCode: z.enum(['essentiel', 'signature']),
  amountMad: z.coerce.number().int().min(0).max(50_000),
  cashConfirmed: z.boolean().refine((v) => v === true, { message: 'cash_required' }),
  designNotes: z.string().trim().max(500).optional().or(z.literal('')),
  defaultLang: z.enum(['fr', 'ar']).default('fr'),
});

export const wizardFormSchema = wizardFormObjectSchema.superRefine((data, ctx) => {
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
});

export type WizardFormValues = z.infer<typeof wizardFormObjectSchema>;
export type WizardLink = z.infer<typeof wizardLinkSchema>;

export type WizardLinkType = Extract<
  LinkType,
  'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'website' | 'custom'
>;

export const WIZARD_LINK_TYPES: WizardLinkType[] = [
  'instagram',
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
  links: [],
  logoUrl: null,
  theme: 'noir',
  accentColor: ACCENT_DEFAULT,
  planCode: 'essentiel',
  amountMad: PLAN_PRICES.essentiel,
  cashConfirmed: false,
  designNotes: '',
  defaultLang: 'fr',
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
