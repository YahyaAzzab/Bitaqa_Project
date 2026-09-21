import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { DesignGallery } from './design-gallery';

export const metadata: Metadata = {
  title: 'Système visuel — Bitaqa',
  robots: { index: false, follow: false },
};

export default async function DesignPage({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const { locale } = await params;
  setRequestLocale(locale);

  return <DesignGallery />;
}
