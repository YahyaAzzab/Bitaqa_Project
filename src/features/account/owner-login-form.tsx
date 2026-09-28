'use client';

import { Eye, EyeOff, MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  sendOwnerMagicLink,
  signInOwner,
  type AccountLoginState,
} from '@/features/account/actions';
import { useKeyboardOffset } from '@/hooks/use-keyboard-offset';

type Props = {
  locale: 'fr' | 'ar';
  nextPath: string | null;
  initialError: AccountLoginState;
};

type Mode = 'password' | 'link';

export function OwnerLoginForm({ locale, nextPath, initialError }: Props) {
  const t = useTranslations('account.login');
  const [mode, setMode] = useState<Mode>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInOwner,
    initialError,
  );
  const [linkState, linkAction, linkPending] = useActionState(sendOwnerMagicLink, null);
  const keyboardOffset = useKeyboardOffset();

  const state = mode === 'password' ? passwordState : linkState;
  const errorMessage = state?.error ? t(`errors.${state.error}`) : null;

  return (
    <div
      className="flex flex-1 flex-col gap-6"
      style={{ paddingBottom: `calc(${keyboardOffset}px + env(safe-area-inset-bottom, 0px))` }}
    >
      <SegmentedControl
        ariaLabel={t('modeLabel')}
        value={mode}
        onChange={setMode}
        segments={[
          { value: 'password', label: t('modePassword') },
          { value: 'link', label: t('modeLink') },
        ]}
      />

      {mode === 'password' ? (
        <form action={passwordAction} className="flex flex-1 flex-col gap-5">
          <input type="hidden" name="locale" value={locale} />
          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
          <Input
            id="owner-email"
            name="email"
            type="email"
            label={t('email')}
            autoComplete="username"
            inputMode="email"
            enterKeyHint="next"
            dir="ltr"
            className="text-[16px]"
            required
            spellCheck={false}
          />
          <Input
            id="owner-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label={t('password')}
            autoComplete="current-password"
            enterKeyHint="go"
            dir="ltr"
            className="text-[16px]"
            required
            minLength={8}
            trailing={
              <IconButton
                type="button"
                label={showPassword ? t('hidePassword') : t('showPassword')}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.75} />
                ) : (
                  <Eye size={18} strokeWidth={1.75} />
                )}
              </IconButton>
            }
          />
          <p className="text-text-muted text-[13px] leading-relaxed">{t('forgot')}</p>
          {errorMessage ? (
            <p role="alert" className="text-error text-[13px]">
              {errorMessage}
            </p>
          ) : null}
          <div className="mt-auto pt-2">
            <Button type="submit" className="w-full" loading={passwordPending}>
              {t('submit')}
            </Button>
          </div>
        </form>
      ) : linkState?.sent ? (
        <div
          role="status"
          className="border-border bg-surface flex flex-col items-center rounded-lg border px-5 py-8 text-center"
        >
          <span className="bg-accent/15 text-accent grid size-12 place-items-center rounded-full">
            <MailCheck className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-4 text-[17px] font-semibold tracking-tight">{t('sentTitle')}</p>
          <p className="text-text-secondary mt-2 max-w-[18rem] text-[14px] leading-relaxed">
            {t('sentBody')}
          </p>
        </div>
      ) : (
        <form action={linkAction} className="flex flex-1 flex-col gap-5">
          <input type="hidden" name="locale" value={locale} />
          <Input
            id="owner-link-email"
            name="email"
            type="email"
            label={t('email')}
            hint={t('linkHint')}
            autoComplete="email"
            inputMode="email"
            enterKeyHint="send"
            dir="ltr"
            className="text-[16px]"
            required
            spellCheck={false}
          />
          {errorMessage ? (
            <p role="alert" className="text-error text-[13px]">
              {errorMessage}
            </p>
          ) : null}
          <div className="mt-auto pt-2">
            <Button type="submit" className="w-full" loading={linkPending}>
              {t('sendLink')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
