'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { signOut } from '@/features/auth/actions';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';

export function SignOutButton({ locale }: { locale: Locale }) {
  const t = useTranslations('dashboard');
  const [pending, start] = useTransition();

  return (
    <Button
      variant="secondary"
      className="w-full"
      loading={pending}
      onClick={() => start(() => signOut(locale))}
    >
      {t('signOut')}
    </Button>
  );
}
