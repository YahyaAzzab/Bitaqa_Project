import { unstable_cache } from 'next/cache';
import { getPublicProfileBySlug } from '@/lib/profile/queries';

/** Cache profil public avec invalidation par tag `profile:{slug}`. */
export function getCachedPublicProfile(slug: string) {
  return unstable_cache(() => getPublicProfileBySlug(slug), [`profile-${slug}`], {
    tags: [`profile:${slug}`],
    revalidate: 60,
  })();
}
