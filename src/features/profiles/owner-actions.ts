'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { provisionProfileOwner } from '@/features/profiles/owner-provision';
import { decryptCredential, encryptCredential } from '@/lib/auth/credential-cipher';
import { OWNER_PASSWORD_MAX, OWNER_PASSWORD_MIN } from '@/lib/auth/owner-password';
import { getSellerSession } from '@/lib/auth/session';
import { rateLimit } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export type OwnerActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const inviteSchema = z.object({
  profileId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email().max(200),
  locale: z.enum(['fr', 'ar']),
});

async function loadManagedProfile(profileId: string) {
  const session = await getSellerSession();
  if (!session) return { error: 'unauthorized' as const };

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('profiles')
    .select('id, slug, owner_user_id, created_by')
    .eq('id', profileId);
  if (session.seller.role !== 'admin') query = query.eq('created_by', session.userId);
  const { data: profile } = await query.maybeSingle();
  if (!profile) return { error: 'not_found' as const };

  return { session, supabase, profile };
}

function revalidateDetail(profileId: string) {
  revalidatePath(`/fr/dashboard/profiles/${profileId}`);
  revalidatePath(`/ar/dashboard/profiles/${profileId}`);
}

export async function inviteProfileOwner(
  raw: z.input<typeof inviteSchema>,
): Promise<OwnerActionResult<{ link: string; email: string }>> {
  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'email_invalid' };
  const { profileId, email, locale } = parsed.data;

  const loaded = await loadManagedProfile(profileId);
  if ('error' in loaded) return { ok: false, error: loaded.error ?? 'generic' };
  const { session, supabase, profile } = loaded;

  if (!rateLimit(`invite:${session.userId}`, { limit: 20, windowMs: 60 * 60_000 }).ok) {
    return { ok: false, error: 'rate_limited' };
  }

  const result = await provisionProfileOwner({
    supabase,
    profileId: profile.id,
    currentOwnerId: profile.owner_user_id,
    email,
    locale,
    actorId: session.userId,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateDetail(profile.id);
  return { ok: true, data: { link: result.link, email } };
}

export async function revokeProfileOwner(profileId: string): Promise<OwnerActionResult> {
  const id = z.string().uuid().safeParse(profileId);
  if (!id.success) return { ok: false, error: 'invalid' };

  const loaded = await loadManagedProfile(id.data);
  if ('error' in loaded) return { ok: false, error: loaded.error ?? 'generic' };
  const { supabase, profile } = loaded;

  const { error } = await supabase
    .from('profiles')
    .update({ owner_user_id: null })
    .eq('id', profile.id);
  if (error) return { ok: false, error: 'generic' };

  revalidateDetail(profile.id);
  return { ok: true, data: undefined };
}

type ManagedProfile = Exclude<Awaited<ReturnType<typeof loadManagedProfile>>, { error: string }>;

async function loadAdminOwner(
  profileId: string,
): Promise<{ ok: false; error: string } | ({ ok: true; ownerId: string } & ManagedProfile)> {
  const loaded = await loadManagedProfile(profileId);
  if ('error' in loaded) return { ok: false, error: loaded.error ?? 'generic' };
  if (loaded.session.seller.role !== 'admin') return { ok: false, error: 'forbidden' };
  if (!loaded.profile.owner_user_id) return { ok: false, error: 'no_owner' };
  return { ok: true, ...loaded, ownerId: loaded.profile.owner_user_id };
}

const clientPasswordSchema = z.object({
  profileId: z.string().uuid(),
  password: z.string().min(OWNER_PASSWORD_MIN).max(OWNER_PASSWORD_MAX),
});

/** Réservé à l'admin : remplace le mot de passe du commerçant et en garde une copie chiffrée. */
export async function setClientPassword(
  raw: z.input<typeof clientPasswordSchema>,
): Promise<OwnerActionResult<{ password: string; setAt: string }>> {
  const parsed = clientPasswordSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'password_short' };
  const { profileId, password } = parsed.data;

  const loaded = await loadAdminOwner(profileId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { session, ownerId, profile } = loaded;

  if (!rateLimit(`client-password:${session.userId}`, { limit: 30, windowMs: 60 * 60_000 }).ok) {
    return { ok: false, error: 'rate_limited' };
  }

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.updateUserById(ownerId, {
    password,
    user_metadata: { password_set: true },
  });
  if (error) {
    return { ok: false, error: error.code === 'weak_password' ? 'password_weak' : 'generic' };
  }

  const setAt = new Date().toISOString();
  const { error: storeError } = await admin.from('owner_credentials').upsert({
    user_id: ownerId,
    password_cipher: encryptCredential(password),
    set_by: session.userId,
    set_at: setAt,
  });
  if (storeError) return { ok: false, error: 'password_not_stored' };

  revalidateDetail(profile.id);
  return { ok: true, data: { password, setAt } };
}

export async function revealClientPassword(
  profileId: string,
): Promise<OwnerActionResult<{ password: string | null }>> {
  const id = z.string().uuid().safeParse(profileId);
  if (!id.success) return { ok: false, error: 'invalid' };

  const loaded = await loadAdminOwner(id.data);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const { data } = await createServiceClient()
    .from('owner_credentials')
    .select('password_cipher')
    .eq('user_id', loaded.ownerId)
    .maybeSingle();
  return { ok: true, data: { password: data ? decryptCredential(data.password_cipher) : null } };
}
