'use client';

import { Check, Copy, Eye, EyeOff, KeyRound, MessageCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { revealClientPassword, setClientPassword } from '@/features/profiles/owner-actions';
import { useRouter } from '@/i18n/navigation';
import { generateOwnerPassword, OWNER_PASSWORD_MIN } from '@/lib/auth/owner-password';
import { toWhatsAppHref } from '@/lib/profile/urls';
import { publicSiteUrl } from '@/lib/site-url';

type Props = {
  profileId: string;
  locale: 'fr' | 'ar';
  email: string;
  clientPhone: string | null;
  businessName: string;
  setAt: string | null;
};

function formatDay(iso: string, locale: 'fr' | 'ar'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA-u-nu-latn' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export function OwnerPasswordPanel({
  profileId,
  locale,
  email,
  clientPhone,
  businessName,
  setAt: initialSetAt,
}: Props) {
  const t = useTranslations('dashboard.owner.password');
  const tOwner = useTranslations('dashboard.owner');
  const { toast } = useToast();
  const router = useRouter();
  const [setAt, setSetAt] = useState(initialSetAt);
  const [password, setPassword] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [revealing, startReveal] = useTransition();
  const [saving, startSave] = useTransition();

  const errorMessage = (code: string) => t(`errors.${code}` as 'errors.generic');

  const toggleVisible = () => {
    if (visible) {
      setVisible(false);
      return;
    }
    if (password) {
      setVisible(true);
      return;
    }
    startReveal(async () => {
      const res = await revealClientPassword(profileId);
      if (!res.ok) {
        toast({ title: errorMessage(res.error), variant: 'error' });
        return;
      }
      if (!res.data.password) {
        toast({ title: t('unavailable'), variant: 'error' });
        return;
      }
      setPassword(res.data.password);
      setVisible(true);
    });
  };

  const copy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: tOwner('copyFailed'), variant: 'error' });
    }
  };

  const openDialog = () => {
    setDraft(generateOwnerPassword());
    setDraftError(null);
    setDialogOpen(true);
  };

  const save = () => {
    if (draft.length < OWNER_PASSWORD_MIN) {
      setDraftError(t('errors.password_short'));
      return;
    }
    startSave(async () => {
      const res = await setClientPassword({ profileId, password: draft });
      if (!res.ok) {
        setDraftError(errorMessage(res.error));
        return;
      }
      setPassword(res.data.password);
      setSetAt(res.data.setAt);
      setVisible(true);
      setDialogOpen(false);
      toast({ title: t('saved'), variant: 'success' });
      router.refresh();
    });
  };

  const loginUrl = `${publicSiteUrl()}/${locale}/account/login`;
  const whatsappHref =
    password && clientPhone
      ? `${toWhatsAppHref(clientPhone)}?text=${encodeURIComponent(
          t('whatsappMessage', { name: businessName, url: loginUrl, email, password }),
        )}`
      : null;

  return (
    <div className="border-border mt-4 border-t pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-text-secondary text-[13px] font-medium">{t('title')}</p>
        {setAt ? (
          <p className="text-text-muted text-[12px]">
            {t('setOn', { date: formatDay(setAt, locale) })}
          </p>
        ) : null}
      </div>

      {setAt ? (
        <div className="border-border bg-bg mt-2 flex min-h-12 items-center rounded-md border ps-3">
          <span
            dir="ltr"
            className="text-text min-w-0 flex-1 truncate font-mono text-[15px] tracking-wide"
            aria-live="polite"
          >
            {visible && password ? password : '••••••••••••'}
          </span>
          <IconButton
            label={visible ? t('hide') : t('show')}
            loading={revealing}
            onClick={toggleVisible}
          >
            {visible ? (
              <EyeOff className="size-[18px]" strokeWidth={1.75} />
            ) : (
              <Eye className="size-[18px]" strokeWidth={1.75} />
            )}
          </IconButton>
          {visible && password ? (
            <IconButton label={copied ? tOwner('copied') : tOwner('copy')} onClick={copy}>
              {copied ? (
                <Check className="text-success size-[18px]" strokeWidth={2} />
              ) : (
                <Copy className="size-[18px]" strokeWidth={1.75} />
              )}
            </IconButton>
          ) : null}
        </div>
      ) : (
        <p className="text-text-muted mt-1 text-[13px] leading-snug">{t('clientChosen')}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={openDialog}
          className={whatsappHref ? '' : 'col-span-2'}
        >
          <KeyRound className="size-4" strokeWidth={1.75} />
          {t('change')}
        </Button>
        {whatsappHref && visible ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable focus-ring border-border bg-surface text-text inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-4 text-[15px] font-medium"
          >
            <MessageCircle className="size-4" strokeWidth={1.75} />
            {t('send')}
          </a>
        ) : null}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t('dialogTitle')}
        closeLabel={tOwner('cancel')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDialogOpen(false)}>
              {tOwner('cancel')}
            </Button>
            <Button className="flex-1" loading={saving} onClick={save}>
              {t('confirm')}
            </Button>
          </div>
        }
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <p className="text-text-secondary text-[14px] leading-relaxed">{t('dialogBody')}</p>
          <Input
            name="client-password"
            label={t('label')}
            dir="ltr"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="done"
            className="font-mono text-[16px]"
            value={draft}
            error={draftError ?? undefined}
            onChange={(event) => {
              setDraft(event.target.value);
              setDraftError(null);
            }}
            trailing={
              <IconButton
                label={t('generate')}
                onClick={() => {
                  setDraft(generateOwnerPassword());
                  setDraftError(null);
                }}
              >
                <RefreshCw className="size-[18px]" strokeWidth={1.75} />
              </IconButton>
            }
          />
        </form>
      </Dialog>
    </div>
  );
}
