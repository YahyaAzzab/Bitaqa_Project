import { unstable_cache } from 'next/cache';
import { isSupabaseConfigured } from '@/lib/env';
import { getPublicProfileBySlug } from '@/lib/profile/queries';
import type { PublicProfile } from '@/lib/profile/types';
import { createServiceClient } from '@/lib/supabase/service';

export type PublicProfileState =
  | { kind: 'live'; profile: PublicProfile }
  | { kind: 'suspended'; nameFr: string; nameAr: string | null }
  | { kind: 'missing' };

/**
 * RLS hides suspended profiles from visitors; only their name is read back (server side)
 * so the card can say "suspended" instead of pretending the link never existed.
 */
async function getSuspendedProfileName(slug: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await createServiceClient()
      .from('profiles')
      .select('business_name_fr, business_name_ar')
      .eq('slug', slug)
      .eq('status', 'suspended')
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

async function loadPublicProfileState(slug: string): Promise<PublicProfileState> {
  const profile = await getPublicProfileBySlug(slug);
  if (profile && profile.status !== 'suspended') return { kind: 'live', profile };

  const suspended = await getSuspendedProfileName(slug);
  if (!suspended) return { kind: 'missing' };
  return {
    kind: 'suspended',
    nameFr: suspended.business_name_fr,
    nameAr: suspended.business_name_ar,
  };
}

/** Cache profil public avec invalidation par tag `profile:{slug}`. */
export function getCachedPublicProfileState(slug: string) {
  return unstable_cache(() => loadPublicProfileState(slug), [`profile-state-${slug}`], {
    tags: [`profile:${slug}`],
    revalidate: 60,
  })();
}
