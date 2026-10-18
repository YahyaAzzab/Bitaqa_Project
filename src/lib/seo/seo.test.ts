import { describe, expect, it } from 'vitest';
import { organizationJsonLd } from '@/lib/seo/organization-json-ld';
import { buildSitemap } from '@/lib/seo/sitemap-entries';

describe('organization json-ld', () => {
  it('names Bitaqa and both sales numbers', () => {
    const raw = organizationJsonLd({
      siteUrl: 'https://bitaqa-project.vercel.app/',
      description: 'Cartes NFC',
    });
    const data = JSON.parse(raw) as {
      name: string;
      url: string;
      logo: string;
      contactPoint: { telephone: string }[];
    };

    expect(data.name).toBe('Bitaqa');
    expect(data.url).toBe('https://bitaqa-project.vercel.app/fr');
    expect(data.logo).toBe('https://bitaqa-project.vercel.app/icons/icon.svg');
    expect(data.contactPoint.map((point) => point.telephone)).toEqual([
      '+212681725242',
      '+212642916060',
    ]);
  });
});

describe('sitemap entries', () => {
  const now = new Date('2026-10-18T12:00:00.000Z');

  it('lists both locales and skips reserved or invalid slugs', () => {
    const urls = buildSitemap(
      'https://bitaqa-project.vercel.app',
      [
        { slug: 'atelier-nour', updatedAt: '2026-10-01T00:00:00.000Z' },
        { slug: 'atelier-nour', updatedAt: '2026-10-02T00:00:00.000Z' },
        { slug: 'login', updatedAt: '2026-10-01T00:00:00.000Z' },
        { slug: 'Bad Slug', updatedAt: '2026-10-01T00:00:00.000Z' },
      ],
      now,
    ).map((entry) => entry.url);

    expect(urls).toContain('https://bitaqa-project.vercel.app/fr');
    expect(urls).toContain('https://bitaqa-project.vercel.app/ar/legal/privacy');
    expect(urls).toContain('https://bitaqa-project.vercel.app/fr/atelier-nour');
    expect(urls).toContain('https://bitaqa-project.vercel.app/ar/atelier-nour');
    expect(urls.filter((url) => url.endsWith('/atelier-nour'))).toHaveLength(2);
    expect(urls.some((url) => url.endsWith('/login'))).toBe(false);
    expect(urls.some((url) => url.includes('Bad'))).toBe(false);
  });
});
