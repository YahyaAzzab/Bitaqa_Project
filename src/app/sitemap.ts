import type { MetadataRoute } from 'next';
import { listIndexableProfiles } from '@/lib/seo/indexable-profiles';
import { buildSitemap } from '@/lib/seo/sitemap-entries';
import { publicSiteUrl } from '@/lib/site-url';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profiles = await listIndexableProfiles();
  return buildSitemap(publicSiteUrl(), profiles);
}
