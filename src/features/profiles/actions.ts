'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSellerSession } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { revalidatePublicProfile } from '@/lib/profile/revalidate-public';
import { themeToDb } from '@/lib/profile/theme';
import { THEME_IDS } from '@/lib/profile/themes';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { Database } from '@/lib/supabase/database.types';

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

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
  email: z
    .string()
    .trim()
    .email()
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  addressFr: z.string().trim().max(200).nullable().optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  theme: z.enum(THEME_IDS).optional(),
  logoUrl: z
    .string()
    .url()
    .refine((url) =>
      url.startsWith(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/`),
    )
    .nullable()
    .optional(),
});

async function revalidateProfile(slug: string, id: string) {
  await revalidatePublicProfile(slug);
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

export async function reactivateProfile(profileId: string): Promise<ProfileActionResult> {
  const session = await getSellerSession();
  if (!session) return { ok: false, error: 'unauthorized' };
  if (session.seller.role !== 'admin') return { ok: false, error: 'forbidden' };

  const id = z.string().uuid().safeParse(profileId);
  if (!id.success) return { ok: false, error: 'invalid' };

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, slug, expires_at')
    .eq('id', id.data)
    .maybeSingle();

  if (!profile) return { ok: false, error: 'not_found' };

  // Suspension never touched the paid period: resume it as it stands.
  const status = new Date(profile.expires_at).getTime() > Date.now() ? 'active' : 'expired';
  const { error } = await supabase.from('profiles').update({ status }).eq('id', profile.id);
  if (error) return { ok: false, error: 'generic' };

  await revalidateProfile(profile.slug, profile.id);
  return { ok: true };
}

const LOGO_PREFIX = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/`;

async function cleanUpDeletedProfile(logoUrl: string | null, ownerId: string | null) {
  const service = createServiceClient();

  if (logoUrl?.startsWith(LOGO_PREFIX)) {
    const { count } = await service
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('logo_url', logoUrl);
    if (!count) await service.storage.from('logos').remove([logoUrl.slice(LOGO_PREFIX.length)]);
  }

  if (ownerId) {
    const [{ count: owned }, { data: seller }] = await Promise.all([
      service
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('owner_user_id', ownerId),
      service.from('sellers').select('id').eq('id', ownerId).maybeSingle(),
    ]);
    if (!owned && !seller) await service.auth.admin.deleteUser(ownerId);
  }
}

export async function deleteProfile(profileId: string): Promise<ProfileActionResult> {
  const session = await getSellerSession();
  if (!session) return { ok: false, error: 'unauthorized' };
  if (session.seller.role !== 'admin') return { ok: false, error: 'forbidden' };

  const id = z.string().uuid().safeParse(profileId);
  if (!id.success) return { ok: false, error: 'invalid' };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('admin_delete_profile', { p_profile_id: id.data });
  if (error) {
    if (error.message.includes('forbidden')) return { ok: false, error: 'forbidden' };
    if (error.message.includes('not_found')) return { ok: false, error: 'not_found' };
    return { ok: false, error: 'generic' };
  }

  const deleted = data?.[0];
  if (!deleted) return { ok: false, error: 'not_found' };

  // The profile is already gone; leftover files or accounts must not turn this into a failure.
  await cleanUpDeletedProfile(deleted.logo_url, deleted.owner_user_id).catch(() => undefined);

  await revalidatePublicProfile(deleted.slug);
  for (const locale of ['fr', 'ar']) {
    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/profiles`);
    revalidatePath(`/${locale}/dashboard/cash`);
    revalidatePath(`/${locale}/dashboard/orders`);
  }
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
  if (parsed.data.logoUrl !== undefined) patch.logo_url = parsed.data.logoUrl;

  const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id);
  if (error) return { ok: false, error: 'generic' };

  await revalidateProfile(profile.slug, profile.id);
  return { ok: true };
}
