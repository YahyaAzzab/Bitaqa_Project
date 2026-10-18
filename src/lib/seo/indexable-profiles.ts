import { unstable_cache } from 'next/cache';
import { isSupabaseConfigured } from '@/lib/env';
import { createAnonClient } from '@/lib/supabase/anon';
import type { SitemapProfile } from '@/lib/seo/sitemap-entries';

const PAGE_SIZE = 1000;

async function loadIndexableProfiles(): Promise<SitemapProfile[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createAnonClient();
    const now = new Date().toISOString();
    const rows: SitemapProfile[] = [];

    for (let from = 0; from < 5000; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('profiles')
        .select('slug, updated_at')
        .eq('status', 'active')
        .gt('expires_at', now)
        .order('slug')
        .range(from, from + PAGE_SIZE - 1);

      if (error || !data?.length) break;
      rows.push(...data.map((row) => ({ slug: row.slug, updatedAt: row.updated_at })));
      if (data.length < PAGE_SIZE) break;
    }

    return rows;
  } catch {
    return [];
  }
}

/** Profils que la page publique laisse indexer. Le cache suit les modifications de profil. */
export const listIndexableProfiles = unstable_cache(
  loadIndexableProfiles,
  ['indexable-profiles'],
  { tags: ['sitemap-profiles'], revalidate: 3600 },
);
