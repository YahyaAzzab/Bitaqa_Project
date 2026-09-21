import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default function HomePage({
export default async function HomePage({
  params,
}: {
  params: { locale: string };
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale(params.locale);
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const tc = await getTranslations({ locale, namespace: 'common' });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ivory sm:text-4xl">
          {t('hero')}
        </h1>
        <p className="mt-4 text-base text-text-secondary">
          {t('subtitle')}
        </p>
        <div className="mt-8">
          <Link
            href="/"
            locale={params.locale === 'fr' ? 'ar' : 'fr'}
            locale={locale === 'fr' ? 'ar' : 'fr'}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            {tc('language')}
          </Link>
        </div>
      </div>
    </main>
  );
}
