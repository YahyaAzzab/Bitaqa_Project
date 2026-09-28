'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { setOwnerPassword } from '@/features/account/actions';
import { useRouter } from '@/i18n/navigation';

type Props = {
  email: string;
  submitLabel: string;
  onDone?: () => void;
};

export function PasswordForm({ email, submitLabel, onDone }: Props) {
  const t = useTranslations('account.password');
  const { toast } = useToast();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    if (password.length < 8) {
      setError(t('errors.password_short'));
      return;
    }
    start(async () => {
      const res = await setOwnerPassword(password);
      if (!res.ok) {
        setError(t(`errors.${res.error}` as 'errors.generic'));
        return;
      }
      setPassword('');
      setError(null);
      toast({ title: t('saved'), variant: 'success' });
      router.refresh();
      onDone?.();
    });
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {/* Aide les gestionnaires de mots de passe à associer le bon compte. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <Input
        name="new-password"
        type={visible ? 'text' : 'password'}
        label={t('label')}
        hint={error ? undefined : t('hint')}
        error={error ?? undefined}
        autoComplete="new-password"
        enterKeyHint="done"
        dir="ltr"
        minLength={8}
        maxLength={72}
        className="text-[16px]"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(null);
        }}
        trailing={
          <IconButton
            type="button"
            label={visible ? t('hide') : t('show')}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? (
              <EyeOff size={18} strokeWidth={1.75} />
            ) : (
              <Eye size={18} strokeWidth={1.75} />
            )}
          </IconButton>
        }
      />
      <Button type="submit" className="w-full" loading={pending} disabled={!password}>
        {submitLabel}
      </Button>
    </form>
  );
}
