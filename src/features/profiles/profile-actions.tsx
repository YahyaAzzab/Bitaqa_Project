'use client';

import { ExternalLink, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { renewProfile, suspendProfile } from '@/features/profiles/actions';
import { PLAN_PRICES } from '@/lib/profile/schema';
import { formatMad } from '@/lib/money';

type Props = {
  profileId: string;
  slug: string;
  planCode: string;
  isAdmin: boolean;
  locale: 'fr' | 'ar';
  publicUrl: string;
};

export function ProfileActions({
  profileId,
  slug,
  planCode,
  isAdmin,
  locale,
  publicUrl,
}: Props) {
  const t = useTranslations('dashboard.profiles');
  const tProfile = useTranslations('profile');
  const { toast } = useToast();
  const router = useRouter();
  const [renewOpen, setRenewOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const renewalDefault =
    planCode === 'signature' ? PLAN_PRICES.signature : PLAN_PRICES.essentiel;
  const [amount, setAmount] = useState<number>(renewalDefault);
  const [pending, start] = useTransition();

  const onRenew = () => {
    start(async () => {
      const res = await renewProfile(profileId, amount);
      if (!res.ok) {
        toast({ title: res.error, variant: 'error' });
        return;
      }
      toast({ title: t('renewed'), variant: 'success' });
      setRenewOpen(false);
      router.refresh();
    });
  };

  const onSuspend = () => {
    start(async () => {
      const res = await suspendProfile(profileId);
      if (!res.ok) {
        toast({ title: res.error, variant: 'error' });
        return;
      }
      setSuspendOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="pressable focus-ring border-border bg-surface inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-md border px-4 text-[15px] font-medium"
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
      <Button variant="primary" className="w-full" onClick={() => setRenewOpen(true)}>
        <RefreshCw className="size-4" strokeWidth={1.75} />
        {t('renew')}
      </Button>
      {isAdmin ? (
        <Button variant="danger" className="w-full" onClick={() => setSuspendOpen(true)}>
          {t('suspend')}
        </Button>
      ) : null}

      <Dialog
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        title={t('renew')}
        closeLabel={tProfile('close')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setRenewOpen(false)}>
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
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        title={t('suspend')}
        closeLabel={tProfile('close')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setSuspendOpen(false)}>
              {tProfile('close')}
            </Button>
            <Button variant="danger" className="flex-1" loading={pending} onClick={onSuspend}>
              {t('suspend')}
            </Button>
          </div>
        }
      >
        <p className="text-text-secondary text-[14px]">{t('confirmSuspend')}</p>
      </Dialog>
    </div>
  );
}
