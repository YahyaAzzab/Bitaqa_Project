import { TEAM_PHONES } from '@/lib/contact';

function origin(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, '');
}

/** Fiche Organization pour la page d'accueil. Le nom latin reste stable en FR et en AR. */
export function organizationJsonLd(input: { siteUrl: string; description: string }): string {
  const site = origin(input.siteUrl);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bitaqa',
    alternateName: 'بطاقة',
    url: `${site}/fr`,
    logo: `${site}/icons/icon.svg`,
    description: input.description,
    areaServed: {
      '@type': 'Country',
      name: 'Morocco',
    },
    contactPoint: TEAM_PHONES.map((phone) => ({
      '@type': 'ContactPoint',
      telephone: phone.href.replace(/^tel:/, ''),
      contactType: 'sales',
      areaServed: 'MA',
      availableLanguage: ['French', 'Arabic'],
    })),
  };

  return JSON.stringify(data).replace(/</g, '\\u003c');
}
