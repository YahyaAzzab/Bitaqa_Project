import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SignOutButton } from '@/features/auth/sign-out-button';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { getSellerSession } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'dashboard.settings' });
  const session = await getSellerSession();

  return (
    <div className="mx-auto w-full max-w-lg space-y-8">
      <section>
        <h2 className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
          {t('profile')}
        </h2>
        <div className="border-border bg-surface mt-2 rounded-lg border px-4 py-4">
          <p className="text-[17px] font-medium">{session?.seller.full_name ?? '—'}</p>
          <p className="text-text-secondary mt-1 text-[14px]">
            {t('role')}: {session?.seller.role ?? '—'}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
          {t('language')}
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link
            href="/dashboard/settings"
            locale="fr"
            className={cn(
              'pressable focus-ring border-border inline-flex min-h-12 items-center justify-center rounded-md border text-[15px] font-medium',
              locale === 'fr' ? 'bg-accent text-accent-fg border-accent' : 'bg-surface text-text',
            )}
          >
            Français
          </Link>
          <Link
            href="/dashboard/settings"
            locale="ar"
            className={cn(
              'pressable focus-ring border-border inline-flex min-h-12 items-center justify-center rounded-md border text-[15px] font-medium',
              locale === 'ar' ? 'bg-accent text-accent-fg border-accent' : 'bg-surface text-text',
            )}
          >
            العربية
          </Link>
        </div>
      </section>

      <SignOutButton locale={locale} />
    </div>
  );
}
