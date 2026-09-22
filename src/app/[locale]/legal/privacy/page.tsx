import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'legal' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  return (
    <main className="bg-bg text-text mx-auto min-h-dvh w-full max-w-lg px-4 py-10">
      <p className="text-accent text-[12px] font-medium tracking-[0.14em] uppercase">Bitaqa</p>
      <h1 className="mt-2 text-[26px] font-semibold tracking-tight">{t('privacy')}</h1>
      <p className="text-text-secondary mt-4 text-[15px] leading-relaxed">{t('privacyBody')}</p>
      <nav className="mt-8 flex flex-col gap-3 text-[14px]">
        <Link href="/legal" className="text-accent font-medium">
          {t('mentions')}
        </Link>
        <Link href="/" className="text-text-secondary">
          {tCommon('back')}
        </Link>
      </nav>
    </main>
  );
}
