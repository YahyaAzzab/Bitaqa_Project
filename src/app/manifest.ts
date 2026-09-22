import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bitaqa',
    short_name: 'Bitaqa',
    description: 'Cartes NFC et espace vendeur Bitaqa',
    start_url: '/fr/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0c0b0a',
    theme_color: '#0c0b0a',
    lang: 'fr',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
