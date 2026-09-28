import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { AccountLoginState } from '@/features/account/actions';
import { OwnerLoginForm } from '@/features/account/owner-login-form';
import type { Locale } from '@/i18n/config';
import { Link } from '@/i18n/navigation';
import { getAccountSession } from '@/lib/auth/account-session';
import { safeAccountNext } from '@/lib/auth/paths';
import { TEAM_PHONES } from '@/lib/contact';
import { isSupabaseConfigured } from '@/lib/env';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Search = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export default async function AccountLoginPage({
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
  const nextRaw = firstParam(query.next);
  const nextPath = nextRaw ? safeAccountNext(nextRaw, locale) : null;

  if (isSupabaseConfigured()) {
    const session = await getAccountSession();
    if (session?.isSeller) redirect(`/${locale}/dashboard`);
    if (session && session.profiles.length > 0) redirect(nextPath ?? `/${locale}/account`);
  }

  const t = await getTranslations({ locale, namespace: 'account.login' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const initialError: AccountLoginState =
    firstParam(query.error) === 'link' ? { error: 'link' } : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(3rem,env(safe-area-inset-top))]">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="focus-ring text-accent w-fit rounded-sm text-[13px] font-medium tracking-[0.12em] uppercase"
          >
            {t('eyebrow')}
          </Link>
          <h1 className="text-[32px] leading-[1.05] font-semibold tracking-tight text-balance">
            {t('title')}
          </h1>
          <p className="text-text-secondary max-w-[20rem] text-[15px] leading-relaxed">
            {t('lede')}
          </p>
        </div>
        <Link
          href="/account/login"
          locale={locale === 'fr' ? 'ar' : 'fr'}
          className="focus-ring pressable border-border text-text-secondary inline-flex min-h-12 shrink-0 items-center rounded-md border px-3 text-sm"
        >
          {tc('language')}
        </Link>
      </header>

      <OwnerLoginForm locale={locale} nextPath={nextPath} initialError={initialError} />

      <footer className="border-border mt-10 border-t py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="text-text-muted text-[13px]">{t('noAccount')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TEAM_PHONES.map((phone) => (
            <a
              key={phone.href}
              href={phone.href}
              dir="ltr"
              className="pressable focus-ring border-border text-text tabular inline-flex min-h-12 items-center rounded-md border px-4 text-[14px] font-medium"
            >
              {phone.display}
            </a>
          ))}
        </div>
        <Link
          href="/login"
          className="focus-ring text-text-muted hover:text-text mt-5 inline-flex min-h-12 items-center rounded-sm text-[13px] underline-offset-4 hover:underline"
        >
          {t('sellerLink')}
        </Link>
      </footer>
    </main>
  );
}
