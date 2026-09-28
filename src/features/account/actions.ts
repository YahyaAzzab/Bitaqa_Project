'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getAccountSession } from '@/lib/auth/account-session';
import { safeAccountNext } from '@/lib/auth/paths';
import { env } from '@/lib/env';
import { normalizeMoroccanPhone } from '@/lib/phone';
import { buildLinksPayload, emptyToNull } from '@/lib/profile/links-payload';
import { ownerProfileSchema, type OwnerProfileValues } from '@/lib/profile/schema';
import { rateLimit } from '@/lib/rate-limit';
import { publicSiteUrl } from '@/lib/site-url';
import type { Json } from '@/lib/supabase/database.types';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export type AccountLoginState = {
  error?: 'invalid' | 'no_profile' | 'rate_limited' | 'link' | 'generic';
  sent?: boolean;
} | null;

export type AccountActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string };

const localeSchema = z.enum(['fr', 'ar']);

const passwordLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  locale: localeSchema,
  next: z.string().optional(),
});

const magicLinkSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  locale: localeSchema,
});

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function signInOwner(
  _prev: AccountLoginState,
  formData: FormData,
): Promise<AccountLoginState> {
  const parsed = passwordLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    locale: formData.get('locale'),
    next: formData.get('next') || undefined,
  });
  if (!parsed.success) return { error: 'invalid' };
  const { email, password, locale, next } = parsed.data;

  if (!rateLimit(`owner-login:${await clientIp()}`, { limit: 10, windowMs: 10 * 60_000 }).ok) {
    return { error: 'rate_limited' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.status === 400 || error.status === 401 ? 'invalid' : 'generic' };
  }

  const session = await getAccountSession();
  if (session?.isSeller) redirect(`/${locale}/dashboard`);
  if (!session || session.profiles.length === 0) {
    await supabase.auth.signOut();
    return { error: 'no_profile' };
  }

  redirect(safeAccountNext(next ?? null, locale));
}

/** Réponse identique que l'adresse existe ou non : pas d'énumération des comptes. */
export async function sendOwnerMagicLink(
  _prev: AccountLoginState,
  formData: FormData,
): Promise<AccountLoginState> {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get('email'),
    locale: formData.get('locale'),
  });
  if (!parsed.success) return { error: 'invalid' };
  const { email, locale } = parsed.data;

  if (!rateLimit(`owner-magic:${await clientIp()}`, { limit: 5, windowMs: 15 * 60_000 }).ok) {
    return { error: 'rate_limited' };
  }

  const supabase = await createServerSupabaseClient();
  const redirectTo = new URL('/api/auth/confirm', publicSiteUrl());
  redirectTo.searchParams.set('next', `/${locale}/account`);
  await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo.toString() },
  });

  return { sent: true };
}

const passwordSchema = z.object({ password: z.string().min(8).max(72) });

export async function setOwnerPassword(password: string): Promise<AccountActionResult> {
  const parsed = passwordSchema.safeParse({ password });
  if (!parsed.success) return { ok: false, error: 'password_short' };

  const session = await getAccountSession();
  if (!session) return { ok: false, error: 'unauthorized' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { password_set: true },
  });
  if (error) {
    return { ok: false, error: error.code === 'same_password' ? 'password_same' : 'generic' };
  }
  // A password the client chose stays theirs alone: the team copy is dropped.
  await createServiceClient().from('owner_credentials').delete().eq('user_id', session.userId);
  revalidatePath('/fr/account');
  revalidatePath('/ar/account');
  return { ok: true, data: undefined };
}

export async function signOutOwner(locale: 'fr' | 'ar') {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect(`/${localeSchema.catch('fr').parse(locale)}/account/login`);
}

function isOwnLogoUrl(url: string): boolean {
  return url.startsWith(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/`);
}

function mapRpcError(message: string): string {
  if (message.includes('profile_inactive')) return 'profile_inactive';
  if (message.includes('forbidden')) return 'forbidden';
  if (message.includes('invalid')) return 'invalid';
  return 'generic';
}

export async function saveOwnProfile(
  raw: OwnerProfileValues,
): Promise<AccountActionResult<{ slug: string }>> {
  const session = await getAccountSession();
  if (!session) return { ok: false, error: 'unauthorized' };

  const parsed = ownerProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'invalid' };
  }
  const values = parsed.data;

  if (!session.profiles.some((p) => p.id === values.profileId)) {
    return { ok: false, error: 'forbidden' };
  }
  if (values.logoUrl && !isOwnLogoUrl(values.logoUrl)) {
    return { ok: false, error: 'invalid' };
  }
  if (!rateLimit(`owner-save:${session.userId}`, { limit: 30, windowMs: 60_000 }).ok) {
    return { ok: false, error: 'rate_limited' };
  }

  const phone = normalizeMoroccanPhone(values.phone);
  if (!phone) return { ok: false, error: 'phone_invalid' };

  const supabase = await createServerSupabaseClient();
  const { data: slug, error } = await supabase.rpc('owner_update_profile', {
    p_profile_id: values.profileId,
    p_business_name_fr: values.businessNameFr,
    p_business_name_ar: emptyToNull(values.businessNameAr),
    p_tagline_fr: emptyToNull(values.taglineFr),
    p_tagline_ar: emptyToNull(values.taglineAr),
    p_address_fr: emptyToNull(values.addressFr),
    p_logo_url: values.logoUrl ?? null,
    p_accent_color: values.accentColor,
    p_theme: values.theme,
    p_phone: phone,
    p_email: emptyToNull(values.email),
    p_hours: values.hoursEnabled ? (values.hours as Json) : null,
    p_links: buildLinksPayload({ ...values, phone }),
  });

  if (error || !slug) return { ok: false, error: mapRpcError(error?.message ?? '') };

  revalidateTag(`profile:${slug}`);
  revalidatePath(`/fr/${slug}`);
  revalidatePath(`/ar/${slug}`);
  revalidatePath('/fr/account');
  revalidatePath('/ar/account');
  return { ok: true, data: { slug } };
}

const ALLOWED_LOGO_TYPES = ['image/webp', 'image/jpeg', 'image/png'];

export async function uploadOwnLogo(
  formData: FormData,
): Promise<AccountActionResult<{ url: string }>> {
  const session = await getAccountSession();
  if (!session || session.profiles.length === 0) return { ok: false, error: 'unauthorized' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'file_missing' };
  if (file.size > 500_000) return { ok: false, error: 'file_too_large' };

  // Certains WebView mobiles envoient un type vide après compression.
  const type = file.type === 'image/jpg' || file.type === '' ? 'image/jpeg' : file.type;
  if (!ALLOWED_LOGO_TYPES.includes(type)) return { ok: false, error: 'file_type' };

  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const path = `owners/${session.userId}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.storage
    .from('logos')
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: type, upsert: false });
  if (error) return { ok: false, error: 'upload_failed' };

  const { data } = supabase.storage.from('logos').getPublicUrl(path);
  return { ok: true, data: { url: data.publicUrl } };
}
