import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { publicSiteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const site = publicSiteUrl();
  const now = new Date();

  const staticPaths = ['', '/legal', '/legal/privacy'];

  return locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${site}/${locale}${path}`,
      lastModified: now,
      changeFrequency: path === '' ? 'weekly' : 'monthly',
      priority: path === '' ? 1 : 0.4,
    })),
  );
}
