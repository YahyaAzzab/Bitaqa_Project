'use client';

import { Check, Languages, LogOut, Phone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PasswordForm } from '@/features/account/password-form';
import { signOutOwner } from '@/features/account/actions';
import { Link } from '@/i18n/navigation';
import type { OwnedProfileSummary } from '@/lib/auth/account-session';
import { TEAM_PHONES } from '@/lib/contact';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  email: string;
  passwordSet: boolean;
  profiles: OwnedProfileSummary[];
  currentProfileId: string;
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-text-muted text-[12px] font-medium tracking-[0.14em] uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function AccountSettings({
  open,
  onClose,
  email,
  passwordSet,
  profiles,
  currentProfileId,
}: Props) {
  const t = useTranslations('account.settings');
  const locale = useLocale() as 'fr' | 'ar';
  const otherLocale = locale === 'fr' ? 'ar' : 'fr';
  const [signingOut, startSignOut] = useTransition();

  return (
    <Sheet open={open} onClose={onClose} title={t('title')} closeLabel={t('close')}>
      <div className="space-y-8 pb-2">
        {profiles.length > 1 ? (
          <Group title={t('cards')}>
            <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
              {profiles.map((p) => {
                const name =
                  locale === 'ar' ? p.businessNameAr || p.businessNameFr : p.businessNameFr;
                const current = p.id === currentProfileId;
                return (
                  <li key={p.id}>
                    <Link
                      href={{ pathname: '/account', query: { p: p.id } }}
                      onClick={onClose}
                      aria-current={current ? 'page' : undefined}
                      className={cn(
                        'pressable focus-ring flex min-h-14 items-center gap-3 px-3',
                        current ? 'bg-accent/10' : 'bg-surface',
                      )}
                    >
                      <Avatar name={name} src={p.logoUrl} size={36} className="rounded-md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{name}</span>
                        <span className="text-text-muted block truncate text-[12px]">
                          <bdi dir="ltr">/{p.slug}</bdi>
                        </span>
                      </span>
                      {current ? (
                        <Check className="text-accent size-4" strokeWidth={2} aria-hidden />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Group>
        ) : null}

        <Group title={t('account')}>
          <p className="border-border bg-surface truncate rounded-md border px-3 py-3 text-[15px]">
            <bdi dir="ltr">{email}</bdi>
          </p>
          <PasswordForm
            email={email}
            submitLabel={passwordSet ? t('changePassword') : t('createPassword')}
          />
        </Group>

        <Group title={t('language')}>
          <Link
            href="/account"
            locale={otherLocale}
            className="pressable focus-ring border-border bg-surface flex min-h-12 items-center gap-3 rounded-md border px-3 text-[15px]"
          >
            <Languages className="text-text-secondary size-5" strokeWidth={1.75} aria-hidden />
            <span lang={otherLocale}>{otherLocale === 'ar' ? 'العربية' : 'Français'}</span>
          </Link>
        </Group>

        <Group title={t('help')}>
          <p className="text-text-secondary text-[13px] leading-relaxed">{t('helpBody')}</p>
          <div className="grid grid-cols-2 gap-2">
            {TEAM_PHONES.map((phone) => (
              <a
                key={phone.href}
                href={phone.href}
                dir="ltr"
                className="pressable focus-ring border-border bg-surface tabular flex min-h-12 items-center justify-center gap-2 rounded-md border text-[14px] font-medium"
              >
                <Phone className="text-accent size-4" strokeWidth={1.75} aria-hidden />
                {phone.display}
              </a>
            ))}
          </div>
        </Group>

        <Button
          variant="ghost"
          className="text-error w-full"
          loading={signingOut}
          onClick={() => startSignOut(() => signOutOwner(locale))}
        >
          <LogOut className="size-4 rtl:-scale-x-100" strokeWidth={1.75} aria-hidden />
          {t('signOut')}
        </Button>
      </div>
    </Sheet>
  );
}
