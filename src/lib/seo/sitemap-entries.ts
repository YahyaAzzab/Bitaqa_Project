import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { isReservedSlug, isValidSlug } from '@/lib/profile/slug';

export type SitemapProfile = {
  slug: string;
  updatedAt: string;
};

const STATIC_PATHS = ['', '/legal', '/legal/privacy'] as const;

function languages(origin: string, path: string): Record<string, string> {
  return Object.fromEntries(locales.map((locale) => [locale, `${origin}/${locale}${path}`]));
}

/** Pages statiques plus les profils publics encore valides, dans les deux langues. */
export function buildSitemap(
  siteUrl: string,
  profiles: SitemapProfile[],
  now = new Date(),
): MetadataRoute.Sitemap {
  const site = siteUrl.replace(/\/+$/, '');

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    STATIC_PATHS.map((path) => ({
      url: `${site}/${locale}${path}`,
      lastModified: now,
      changeFrequency: path === '' ? 'weekly' : 'monthly',
      priority: path === '' ? 1 : 0.4,
      alternates: { languages: languages(site, path) },
    })),
  );

  const seen = new Set<string>();
  const profileEntries: MetadataRoute.Sitemap = [];

  for (const profile of profiles) {
    if (!isValidSlug(profile.slug) || isReservedSlug(profile.slug) || seen.has(profile.slug)) {
      continue;
    }
    seen.add(profile.slug);
    const updated = new Date(profile.updatedAt);
    const lastModified = Number.isNaN(updated.getTime()) ? now : updated;
    const path = `/${profile.slug}`;

    for (const locale of locales) {
      profileEntries.push({
        url: `${site}/${locale}${path}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: languages(site, path) },
      });
    }
  }

  return [...staticEntries, ...profileEntries];
}
