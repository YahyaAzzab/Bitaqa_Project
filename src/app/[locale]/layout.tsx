import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Instrument_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { AppProviders } from '@/components/providers';
import { locales, isRtl } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import '../globals.css';

const latin = Instrument_Sans({
  variable: '--font-latin',
  subsets: ['latin'],
  display: 'swap',
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const meta = messages.metadata as Record<string, string>;

  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = isRtl(locale as Locale) ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${latin.variable} ${plexArabic.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="bg-bg text-text min-h-full antialiased">
        <AppProviders>
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </AppProviders>
      </body>
    </html>
  );
}
