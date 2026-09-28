'use client';

import { Check, Copy, KeyRound, MessageCircle, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { inviteProfileOwner, revokeProfileOwner } from '@/features/profiles/owner-actions';
import { takeOwnerLink } from '@/features/profiles/owner-link-handoff';
import { OwnerPasswordPanel } from '@/features/profiles/owner-password-panel';
import { useRouter } from '@/i18n/navigation';
import { toWhatsAppHref } from '@/lib/profile/urls';

type Props = {
  profileId: string;
  locale: 'fr' | 'ar';
  ownerEmail: string | null;
  clientPhone: string | null;
  businessName: string;
  /** Écran « Lien prêt » : reprend le lien créé avec le profil. */
  handoffSlug?: string;
  /** Admin uniquement : gestion du mot de passe du commerçant. */
  passwordAdmin?: { setAt: string | null } | null;
};

export function ProfileOwnerAccess({
  profileId,
  locale,
  ownerEmail,
  clientPhone,
  businessName,
  handoffSlug,
  passwordAdmin = null,
}: Props) {
  const t = useTranslations('dashboard.owner');
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState(ownerEmail ?? '');
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!handoffSlug) return;
    const handedOff = takeOwnerLink(handoffSlug);
    if (handedOff) setLink(handedOff);
  }, [handoffSlug]);

  const invite = (target: string) => {
    setError(null);
    start(async () => {
      const res = await inviteProfileOwner({ profileId, email: target, locale });
      if (!res.ok) {
        setError(t(`errors.${res.error}` as 'errors.generic'));
        return;
      }
      setLink(res.data.link);
      setCopied(false);
      router.refresh();
    });
  };

  const revoke = () => {
    start(async () => {
      const res = await revokeProfileOwner(profileId);
      if (!res.ok) {
        toast({ title: t('errors.generic'), variant: 'error' });
        return;
      }
      setRevokeOpen(false);
      setLink(null);
      setEmail('');
      toast({ title: t('revoked'), variant: 'success' });
      router.refresh();
    });
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      toast({ title: t('copyFailed'), variant: 'error' });
    }
  };

  const whatsappHref =
    link && clientPhone
      ? `${toWhatsAppHref(clientPhone)}?text=${encodeURIComponent(
          t('whatsappMessage', { name: businessName, link }),
        )}`
      : null;

  return (
    <section className="border-border bg-surface rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span className="border-border bg-bg text-accent grid size-10 shrink-0 place-items-center rounded-md border">
          <UserRound className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold">{t('title')}</h2>
          <p className="text-text-secondary mt-0.5 text-[13px] leading-snug">
            {ownerEmail ? t('activeHint') : t('hint')}
          </p>
          {ownerEmail ? (
            <p className="text-text mt-2 truncate text-[14px]">
              <bdi dir="ltr">{ownerEmail}</bdi>
            </p>
          ) : null}
        </div>
      </div>

      {!ownerEmail ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            invite(email);
          }}
        >
          <Input
            name="owner-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            enterKeyHint="send"
            dir="ltr"
            className="text-[16px]"
            label={t('emailLabel')}
            placeholder="client@exemple.ma"
            value={email}
            error={error ?? undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" className="w-full" loading={pending} disabled={!email.trim()}>
            <KeyRound className="size-4" strokeWidth={1.75} />
            {t('invite')}
          </Button>
        </form>
      ) : null}

      {link ? (
        <div className="border-border bg-bg mt-4 rounded-md border p-3">
          <p className="text-text-secondary text-[13px]">{t('linkReady')}</p>
          <p className="text-text-muted mt-1 text-[12px]">{t('linkExpiry')}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => void copy()}>
              {copied ? (
                <Check className="text-success size-4" strokeWidth={2} />
              ) : (
                <Copy className="size-4" strokeWidth={1.75} />
              )}
              {copied ? t('copied') : t('copy')}
            </Button>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable focus-ring bg-accent text-accent-fg inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-[15px] font-medium"
              >
                <MessageCircle className="size-4" strokeWidth={1.75} />
                {t('sendWhatsapp')}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {ownerEmail ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" loading={pending} onClick={() => invite(ownerEmail)}>
            {t('newLink')}
          </Button>
          <Button variant="ghost" onClick={() => setRevokeOpen(true)}>
            {t('revoke')}
          </Button>
        </div>
      ) : null}
      {ownerEmail && error ? <p className="text-error mt-2 text-[13px]">{error}</p> : null}

      {ownerEmail && passwordAdmin ? (
        <OwnerPasswordPanel
          profileId={profileId}
          locale={locale}
          email={ownerEmail}
          clientPhone={clientPhone}
          businessName={businessName}
          setAt={passwordAdmin.setAt}
        />
      ) : null}

      <Dialog
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        title={t('revokeTitle')}
        closeLabel={t('cancel')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setRevokeOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="danger" className="flex-1" loading={pending} onClick={revoke}>
              {t('revoke')}
            </Button>
          </div>
        }
      >
        <p className="text-text-secondary text-[14px]">{t('revokeBody')}</p>
      </Dialog>
    </section>
  );
}
