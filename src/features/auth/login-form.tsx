'use client';

import { useActionState, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';
import { signIn } from '@/features/auth/actions';
import type { LoginState } from '@/lib/auth/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconButton } from '@/components/ui/icon-button';

type LoginFormProps = {
  locale: 'fr' | 'ar';
  nextPath: string | null;
  initialError: LoginState;
};

export function LoginForm({ locale, nextPath, initialError }: LoginFormProps) {
  const t = useTranslations('login');
  const [state, formAction, pending] = useActionState(signIn, initialError);
  const [showPassword, setShowPassword] = useState(false);
  const [vvOffset, setVvOffset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const sync = () => {
      setVvOffset(Math.max(0, window.innerHeight - viewport.height));
    };

    sync();
    viewport.addEventListener('resize', sync);
    viewport.addEventListener('scroll', sync);
    return () => {
      viewport.removeEventListener('resize', sync);
      viewport.removeEventListener('scroll', sync);
    };
  }, []);

  const errorMessage =
    state?.error === 'invalid'
      ? t('errorInvalid')
      : state?.error === 'forbidden'
        ? t('errorForbidden')
        : state?.error === 'generic'
          ? t('errorGeneric')
          : null;

  return (
    <form
      action={formAction}
      className="flex flex-1 flex-col gap-6"
      style={{ paddingBottom: `calc(${vvOffset}px + env(safe-area-inset-bottom, 0px))` }}
    >
      <input type="hidden" name="locale" value={locale} />
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      <Input
        id="email"
        name="email"
        type="email"
        label={t('email')}
        autoComplete="username"
        inputMode="email"
        enterKeyHint="next"
        dir="ltr"
        required
        autoFocus
        spellCheck={false}
      />

      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        label={t('password')}
        autoComplete="current-password"
        enterKeyHint="go"
        dir="ltr"
        required
        minLength={8}
        trailing={
          <IconButton
            type="button"
            label={showPassword ? t('hidePassword') : t('showPassword')}
            className="size-12"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <EyeOff size={18} strokeWidth={1.75} />
            ) : (
              <Eye size={18} strokeWidth={1.75} />
            )}
          </IconButton>
        }
      />

      {errorMessage ? (
        <p role="alert" className="text-error text-[13px]">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-auto pt-4">
        <Button type="submit" className="w-full" loading={pending}>
          {t('submit')}
        </Button>
      </div>
    </form>
  );
}
