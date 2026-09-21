export const locales = ['fr', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}
