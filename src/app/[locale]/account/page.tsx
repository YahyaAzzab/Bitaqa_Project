import type { Metadata } from 'next';
import { CreditCard, LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/ui/empty-state';
import { AccountEditor } from '@/features/account/account-editor';
import { signOutOwner } from '@/features/account/actions';
import { loadOwnerProfile } from '@/features/account/load-profile';
import type { Locale } from '@/i18n/config';
import { getAccountSession } from '@/lib/auth/account-session';
import { TEAM_PHONES } from '@/lib/contact';
import { isSupabaseConfigured } from '@/lib/env';
import { publicProfileUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Search = Record<string, string | string[] | undefined>;

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  if (!isSupabaseConfigured()) redirect(`/${locale}/account/login`);
  const session = await getAccountSession();
  if (!session) redirect(`/${locale}/account/login`);

  if (session.profiles.length === 0) {
    if (session.isSeller) redirect(`/${locale}/dashboard`);
    const t = await getTranslations({ locale, namespace: 'account' });
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4">
        <EmptyState
          icon={<CreditCard className="size-6" strokeWidth={1.5} />}
          title={t('noCardTitle')}
          description={t('noCardBody')}
          action={
            <div className="flex flex-col gap-2">
              {TEAM_PHONES.map((phone) => (
                <a
                  key={phone.href}
                  href={phone.href}
                  dir="ltr"
                  className="pressable focus-ring border-border bg-surface tabular inline-flex min-h-12 items-center justify-center rounded-md border px-5 text-[15px] font-medium"
                >
                  {phone.display}
                </a>
              ))}
              <form action={signOutOwner.bind(null, locale)}>
                <button
                  type="submit"
                  className="pressable focus-ring text-text-secondary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md text-[14px]"
                >
                  <LogOut className="size-4 rtl:-scale-x-100" strokeWidth={1.75} aria-hidden />
                  {t('settings.signOut')}
                </button>
              </form>
            </div>
          }
        />
      </main>
    );
  }

  const query = await searchParams;
  const requested = typeof query.p === 'string' ? query.p : null;
  const current = session.profiles.find((p) => p.id === requested) ?? session.profiles[0];
  if (!current) redirect(`/${locale}/account/login`);

  const loaded = await loadOwnerProfile(current.id);
  if (!loaded) redirect(`/${locale}/account/login`);

  return (
    <main className="min-h-dvh">
      <AccountEditor
        key={loaded.meta.id}
        initial={loaded.values}
        meta={loaded.meta}
        stats={loaded.stats}
        publicUrl={publicProfileUrl(locale, loaded.meta.slug)}
        email={session.email}
        passwordSet={session.passwordSet}
        profiles={session.profiles}
      />
    </main>
  );
}
