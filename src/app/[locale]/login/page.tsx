import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LoginForm } from '@/features/auth/login-form';
import type { LoginState } from '@/lib/auth/schema';
import { safeDashboardNext } from '@/lib/auth/paths';
import type { Locale } from '@/i18n/config';

type Search = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const query = await searchParams;
  const t = await getTranslations({ locale, namespace: 'login' });
  const tc = await getTranslations({ locale, namespace: 'common' });

  const nextRaw = firstParam(query.next);
  const nextPath = nextRaw ? safeDashboardNext(nextRaw, locale) : null;
  const initialError: LoginState =
    firstParam(query.error) === 'forbidden' ? { error: 'forbidden' } : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-12">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-accent text-[13px] font-medium tracking-[0.12em] uppercase">Bitaqa</p>
          <h1 className="text-[32px] leading-none font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-text-secondary max-w-[18rem] text-[15px] leading-relaxed">
            {t('lede')}
          </p>
        </div>
        <Link
          href="/login"
          locale={locale === 'fr' ? 'ar' : 'fr'}
          className="focus-ring pressable border-border text-text-secondary inline-flex min-h-12 shrink-0 items-center rounded-md border px-3 text-sm"
        >
          {tc('language')}
        </Link>
      </header>
      <LoginForm locale={locale} nextPath={nextPath} initialError={initialError} />
    </main>
  );
}
