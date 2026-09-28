'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { provisionProfileOwner } from '@/features/profiles/owner-provision';
import { getSellerSession } from '@/lib/auth/session';
import { rateLimit } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
