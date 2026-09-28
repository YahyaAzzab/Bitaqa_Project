'use client';

import { ExternalLink, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import {
  deleteProfile,
  reactivateProfile,
  renewProfile,
  suspendProfile,
} from '@/features/profiles/actions';
import { PLAN_PRICES, SUSPENSION_REASON_MAX } from '@/lib/profile/schema';
import { formatMad } from '@/lib/money';

type Props = {
  profileId: string;
  slug: string;
  planCode: string;
  suspended: boolean;
  suspensionReason: string | null;
  businessName: string;
  isAdmin: boolean;
  locale: 'fr' | 'ar';
  publicUrl: string;
};

type OpenDialog = 'renew' | 'suspend' | 'delete' | null;

const KNOWN_ERRORS = ['unauthorized', 'forbidden', 'not_found', 'invalid'] as const;

export function ProfileActions({
  profileId,
  slug,
  planCode,
  suspended,
  suspensionReason,
  businessName,
  isAdmin,
  locale,
  publicUrl,
}: Props) {
  const t = useTranslations('dashboard.profiles');
  const tProfile = useTranslations('profile');
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState<OpenDialog>(null);
  const renewalDefault = planCode === 'signature' ? PLAN_PRICES.signature : PLAN_PRICES.essentiel;
  const [amount, setAmount] = useState<number>(renewalDefault);
  const [confirmName, setConfirmName] = useState('');
  const [reason, setReason] = useState('');
  const [pending, start] = useTransition();

  const errorMessage = (code: string) =>
    t(`actionErrors.${KNOWN_ERRORS.find((known) => known === code) ?? 'generic'}`);

  const run = (
    action: () => Promise<{ ok: true } | { ok: false; error: string }>,
    onSuccess: () => void,
  ) => {
    start(async () => {
      const res = await action();
      if (!res.ok) {
        toast({ title: errorMessage(res.error), variant: 'error' });
        return;
      }
      onSuccess();
    });
  };

  const onRenew = () =>
    run(
      () => renewProfile(profileId, amount),
      () => {
        toast({ title: t('renewed'), variant: 'success' });
        setOpen(null);
        router.refresh();
      },
    );

  const onSuspend = () =>
    run(
      () => suspendProfile(profileId, reason),
      () => {
        toast({ title: t('suspended'), variant: 'success' });
        closeDialog();
        router.refresh();
      },
    );

  const onReactivate = () =>
    run(
      () => reactivateProfile(profileId),
      () => {
        toast({ title: t('reactivated'), variant: 'success' });
        router.refresh();
      },
    );

  const onDelete = () =>
    run(
      () => deleteProfile(profileId),
      () => {
        toast({ title: t('deleted'), variant: 'success' });
        setOpen(null);
        router.replace('/dashboard/profiles');
      },
    );

  const closeDialog = () => {
    setOpen(null);
    setConfirmName('');
    setReason('');
  };

  const deleteConfirmed = confirmName.trim().toLowerCase() === businessName.trim().toLowerCase();

  return (
    <div className="space-y-2">
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="pressable focus-ring border-border bg-surface inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border px-4 text-[15px] font-medium"
      >
        <ExternalLink className="size-4" strokeWidth={1.75} />
        {t('open')}
      </a>
      <Button
        variant="secondary"
        className="w-full"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(publicUrl);
            toast({ title: tProfile('linkCopied'), variant: 'success' });
          } catch {
            toast({ title: tProfile('copyFailed'), variant: 'error' });
          }
        }}
      >
        {t('copy')}
      </Button>
      <Button variant="primary" className="w-full" onClick={() => setOpen('renew')}>
        <RefreshCw className="size-4" strokeWidth={1.75} />
        {t('renew')}
      </Button>

      {isAdmin ? (
        <div className="border-border mt-4 space-y-2 border-t pt-4">
          {suspended && suspensionReason ? (
            <div className="border-border bg-surface rounded-md border px-4 py-3">
              <p className="text-text-muted text-[12px] font-medium tracking-wide">
                {t('suspendReasonLabel')}
              </p>
              <p className="mt-1 text-[14px] leading-relaxed break-words whitespace-pre-line">
                {suspensionReason}
              </p>
            </div>
          ) : null}
          {suspended ? (
            <Button variant="secondary" className="w-full" loading={pending} onClick={onReactivate}>
              <RotateCcw className="size-4" strokeWidth={1.75} />
              {t('reactivate')}
            </Button>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setOpen('suspend')}>
              {t('suspend')}
            </Button>
          )}
          <Button variant="danger" className="w-full" onClick={() => setOpen('delete')}>
            <Trash2 className="size-4" strokeWidth={1.75} />
            {t('delete')}
          </Button>
        </div>
      ) : null}

      <Dialog
        open={open === 'renew'}
        onClose={closeDialog}
        title={t('renew')}
        closeLabel={tProfile('close')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={closeDialog}>
              {tProfile('close')}
            </Button>
            <Button className="flex-1" loading={pending} onClick={onRenew}>
              {t('renew')}
            </Button>
          </div>
        }
      >
        <p className="text-text-secondary text-[14px]">{t('confirmRenew')}</p>
        <div className="mt-4">
          <Input
            label={formatMad(amount, locale)}
            type="number"
            inputMode="numeric"
            className="text-[16px]"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
          />
        </div>
        <p className="text-text-muted mt-2 text-[12px]" dir="ltr">
          /{slug}
        </p>
      </Dialog>

      <Dialog
        open={open === 'suspend'}
        onClose={closeDialog}
        title={t('suspend')}
        closeLabel={tProfile('close')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={closeDialog}>
              {tProfile('close')}
            </Button>
            <Button variant="danger" className="flex-1" loading={pending} onClick={onSuspend}>
              {t('suspend')}
            </Button>
          </div>
        }
      >
        <p className="text-text-secondary text-[14px]">{t('confirmSuspend')}</p>
        <div className="mt-4">
          <Textarea
            label={t('suspendReasonLabel')}
            hint={t('suspendReasonHint', {
              count: SUSPENSION_REASON_MAX - reason.length,
            })}
            placeholder={t('suspendReasonPlaceholder')}
            maxLength={SUSPENSION_REASON_MAX}
            rows={3}
            enterKeyHint="done"
            className="text-[16px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </Dialog>

      <Dialog
        open={open === 'delete'}
        onClose={closeDialog}
        title={t('delete')}
        closeLabel={tProfile('close')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={closeDialog}>
              {tProfile('close')}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={pending}
              disabled={!deleteConfirmed}
              onClick={onDelete}
            >
              {t('deleteConfirmCta')}
            </Button>
          </div>
        }
      >
        <p className="text-text-secondary text-[14px]">{t('confirmDelete')}</p>
        <div className="mt-4">
          <Input
            label={t('deleteTypeName', { name: businessName })}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            className="text-[16px]"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
