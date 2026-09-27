const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.)/i;

/**
 * Origine publique des liens écrits sur les cartes NFC. Une carte gravée avec une
 * adresse locale serait inutilisable : on retombe sur le domaine de production Vercel.
 */
export function publicSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  if (configured && !LOCAL_ORIGIN.test(configured)) return configured;

  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`;

  return configured || 'http://localhost:3000';
}

export function publicProfileUrl(locale: 'fr' | 'ar', slug: string): string {
  return `${publicSiteUrl()}/${locale}/${slug}`;
}
