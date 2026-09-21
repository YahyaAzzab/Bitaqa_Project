import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSellerSession } from '@/lib/auth/session';
import { SignOutButton } from '@/features/auth/sign-out-button';
import type { Locale } from '@/i18n/config';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const session = await getSellerSession();
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-12 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <p className="text-accent text-[13px] font-medium tracking-[0.12em] uppercase">Bitaqa</p>
      <h1 className="mt-2 text-[32px] leading-none font-semibold tracking-tight">{t('title')}</h1>
      <p className="text-text-secondary mt-3 text-[15px] leading-relaxed">
        {t('hello', { name: session?.seller.full_name ?? '' })}
      </p>
      <div className="mt-10">
        <SignOutButton locale={locale} />
      </div>
    </main>
  );
}
