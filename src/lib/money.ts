/** Formatage MAD cohérent FR / AR (chiffres occidentaux). */
export function formatMad(amount: number, locale: 'fr' | 'ar' = 'fr'): string {
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'fr-MA' : 'fr-MA', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} MAD`;
}
