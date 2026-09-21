import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const tc = await getTranslations({ locale, namespace: 'common' });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-ivory text-3xl font-bold tracking-tight sm:text-4xl">{t('hero')}</h1>
        <p className="text-text-secondary mt-4 text-base">{t('subtitle')}</p>
        <div className="mt-8">
          <Link
            href="/"
            locale={locale === 'fr' ? 'ar' : 'fr'}
            className="border-border text-text-secondary hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {tc('language')}
          </Link>
        </div>
      </div>
    </main>
  );
}
