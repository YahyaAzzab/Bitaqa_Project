'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { getSellerSession } from '@/lib/auth/session';
import { themeToDb } from '@/lib/profile/theme';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

export type ProfileActionResult =
  | { ok: true }
  | { ok: false; error: string };

const renewSchema = z.object({
  profileId: z.string().uuid(),
  amountMad: z.coerce.number().int().min(0).max(50_000),
});

const updateSchema = z.object({
  profileId: z.string().uuid(),
  businessNameFr: z.string().trim().min(2).max(80).optional(),
  businessNameAr: z.string().trim().max(80).nullable().optional(),
  taglineFr: z.string().trim().max(120).nullable().optional(),
  taglineAr: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  email: z.string().trim().email().nullable().optional().or(z.literal('').transform(() => null)),
  addressFr: z.string().trim().max(200).nullable().optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  theme: z.enum(['noir', 'ivoire']).optional(),
});

async function revalidateProfile(slug: string, id: string) {
  revalidateTag(`profile:${slug}`);
  revalidatePath(`/fr/${slug}`);
  revalidatePath(`/ar/${slug}`);
  revalidatePath(`/fr/dashboard/profiles/${id}`);
  revalidatePath(`/ar/dashboard/profiles/${id}`);
  revalidatePath('/fr/dashboard/profiles');
  revalidatePath('/ar/dashboard/profiles');
}

export async function renewProfile(
  profileId: string,
  amountMad: number,
): Promise<ProfileActionResult> {
  const session = await getSellerSession();
  if (!session) return { ok: false, error: 'unauthorized' };

  const parsed = renewSchema.safeParse({ profileId, amountMad });
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, slug')
    .eq('id', parsed.data.profileId)
    .maybeSingle();

  if (!profile) return { ok: false, error: 'not_found' };

  const { error } = await supabase.rpc('renew_profile', {
    p_profile_id: parsed.data.profileId,
    p_amount_mad: parsed.data.amountMad,
  });

  if (error) return { ok: false, error: 'generic' };

  await revalidateProfile(profile.slug, profile.id);
  return { ok: true };
}

export async function suspendProfile(profileId: string): Promise<ProfileActionResult> {
  const session = await getSellerSession();
  if (!session) return { ok: false, error: 'unauthorized' };
  if (session.seller.role !== 'admin') return { ok: false, error: 'forbidden' };

  const id = z.string().uuid().safeParse(profileId);
  if (!id.success) return { ok: false, error: 'invalid' };

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, slug')
    .eq('id', id.data)
    .maybeSingle();

  if (!profile) return { ok: false, error: 'not_found' };

  const { error } = await supabase
    .from('profiles')
    .update({ status: 'suspended' })
    .eq('id', profile.id);

  if (error) return { ok: false, error: 'generic' };

  await revalidateProfile(profile.slug, profile.id);
  return { ok: true };
}

export async function updateProfile(
  raw: z.infer<typeof updateSchema>,
): Promise<ProfileActionResult> {
  const session = await getSellerSession();
  if (!session) return { ok: false, error: 'unauthorized' };

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, slug')
    .eq('id', parsed.data.profileId)
    .maybeSingle();

  if (!profile) return { ok: false, error: 'not_found' };

  const patch: Database['public']['Tables']['profiles']['Update'] = {};
  if (parsed.data.businessNameFr !== undefined) {
    patch.business_name_fr = parsed.data.businessNameFr;
  }
  if (parsed.data.businessNameAr !== undefined) {
    patch.business_name_ar = parsed.data.businessNameAr;
  }
  if (parsed.data.taglineFr !== undefined) patch.tagline_fr = parsed.data.taglineFr;
  if (parsed.data.taglineAr !== undefined) patch.tagline_ar = parsed.data.taglineAr;
  if (parsed.data.phone !== undefined) patch.phone = parsed.data.phone;
  if (parsed.data.email !== undefined) patch.email = parsed.data.email;
  if (parsed.data.addressFr !== undefined) patch.address_fr = parsed.data.addressFr;
  if (parsed.data.accentColor !== undefined) patch.accent_color = parsed.data.accentColor;
  if (parsed.data.theme !== undefined) patch.theme = themeToDb(parsed.data.theme);

  const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id);
  if (error) return { ok: false, error: 'generic' };

  await revalidateProfile(profile.slug, profile.id);
  return { ok: true };
}
