import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';

export default async function ProfileNotFound({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = (resolved.locale as Locale) || 'fr';
  const t = await getTranslations({ locale, namespace: 'profile' });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-accent text-[13px] font-medium tracking-[0.14em] uppercase">Bitaqa</p>
      <h1 className="mt-3 text-[28px] font-semibold tracking-tight">{t('notFoundTitle')}</h1>
      <p className="text-text-secondary mt-3 max-w-sm text-[15px] leading-relaxed">
        {t('notFoundBody')}
      </p>
      <Link
        href="/"
        locale={locale}
        className="pressable focus-ring bg-accent text-accent-fg mt-8 inline-flex min-h-12 items-center rounded-md px-5 text-[15px] font-medium"
      >
        {t('notFoundCta')}
      </Link>
    </main>
  );
}
