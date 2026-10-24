'use client';

import { CalendarDays, Check, ChevronRight, Copy, Gift, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import type { OwnerProfileMeta, OwnerReferralStats } from '@/features/account/load-profile';
import { cn } from '@/lib/utils';

type Props = {
  meta: OwnerProfileMeta;
  referral: OwnerReferralStats;
  locale: 'fr' | 'ar';
};

function remainingTime(expiresAt: string): {
  days: number;
  unit: 'day' | 'month' | 'year';
  count: number;
  soon: boolean;
} | null {
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return null;
  if (days <= 45) return { days, unit: 'day', count: days, soon: days <= 30 };
  const months = Math.max(1, Math.round(days / 30.437));
  if (months < 18) return { days, unit: 'month', count: months, soon: false };
  return { days, unit: 'year', count: Math.max(1, Math.round(days / 365.25)), soon: false };
}

export function AccountPlan({ meta, referral, locale }: Props) {
  const t = useTranslations('account');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const expires = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA-u-nu-latn' : 'fr-FR', {
    dateStyle: 'long',
  }).format(new Date(meta.expiresAt));
  const left = remainingTime(meta.expiresAt);
  const periodStartMs = new Date(meta.expiresAt).getTime() - 365.25 * 86_400_000;
  const periodProgress = Math.min(
    1,
    Math.max(0, (Date.now() - periodStartMs) / (365.25 * 86_400_000)),
  );
  const timeLeftLabel = !left
    ? t('timeLeftGone')
    : left.soon
      ? t('timeLeftSoon', { count: left.count })
      : left.unit === 'day'
        ? t('timeLeftDays', { count: left.count })
        : left.unit === 'month'
          ? t('timeLeftMonths', { count: left.count })
          : t('timeLeftYears', { count: left.count });
  const timeShort = !left
    ? t('timeShortGone')
    : left.unit === 'day'
      ? t('timeShortDays', { count: left.count })
      : left.unit === 'month'
        ? t('timeShortMonths', { count: left.count })
        : t('timeShortYears', { count: left.count });
  const planLabel =
    meta.planCode === 'signature'
      ? t('planSignature')
      : meta.planCode === 'essentiel'
        ? t('planEssentiel')
        : t('planOther', { code: meta.planCode });

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referral.code);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1800);
      toast({ title: t('referralCopied'), variant: 'success' });
    } catch {
      toast({ title: t('copyFailed'), variant: 'error' });
    }
  };

  const shareReferral = async () => {
    const text = t('referralShareText', { code: referral.code });
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text, title: t('referral') });
        return;
      } catch {
        return;
      }
    }
    await copyReferralCode();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pressable focus-ring border-border bg-bg hover:border-accent/40 mt-2 flex min-h-12 w-full items-center gap-2 rounded-md border px-3 text-start"
      >
        <CalendarDays
          className={cn('size-4 shrink-0', left?.soon || !left ? 'text-warning' : 'text-accent')}
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
          {planLabel}
          <span className="text-text-muted font-normal"> · {timeShort}</span>
        </span>
        {referral.code ? (
          <span className="text-text-secondary inline-flex shrink-0 items-center gap-1.5 text-[13px]">
            <Gift className="text-accent size-4" strokeWidth={1.75} aria-hidden />
            {t('referral')}
          </span>
        ) : null}
        <ChevronRight
          className="text-text-muted size-4 shrink-0 rtl:-scale-x-100"
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t('subscription')}
        closeLabel={t('settings.close')}
      >
        <div className="space-y-4">
          <section aria-label={t('subscription')}>
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md border',
                  left && !left.soon
                    ? 'border-accent/35 text-accent bg-accent/10'
                    : 'border-warning/40 text-warning bg-warning/10',
                )}
                aria-hidden
              >
                <CalendarDays className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
                    {t('subscription')}
                  </p>
                  <span className="border-border bg-bg text-text-secondary inline-flex min-h-7 items-center rounded-full border px-2.5 text-[12px] font-medium">
                    {planLabel}
                  </span>
                </div>
                <p className="mt-1.5 text-[15px] leading-snug font-semibold">{timeLeftLabel}</p>
                <p className="text-text-secondary mt-1 text-[13px]">
                  {t('expiresOn', { date: expires })}
                </p>
                {left ? (
                  <div
                    className="bg-border mt-3 h-1.5 overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(periodProgress * 100)}
                    aria-label={timeLeftLabel}
                  >
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width] duration-300',
                        left.soon ? 'bg-warning' : 'bg-accent',
                      )}
                      style={{ width: `${Math.round(periodProgress * 100)}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {referral.code ? (
            <section aria-label={t('referral')} className="border-border border-t pt-4">
              <div className="flex items-start gap-3">
                <span
                  className="border-accent/35 text-accent bg-accent/10 mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md border"
                  aria-hidden
                >
                  <Gift className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
                    {t('referral')}
                  </p>
                  <p className="mt-1.5 text-[15px] leading-snug font-semibold">
                    {t('referralTitle')}
                  </p>
                  <p className="text-text-secondary mt-1 text-[13px] leading-relaxed">
                    {t('referralBody')}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <p
                      dir="ltr"
                      className="border-border bg-bg flex min-w-0 flex-1 items-center rounded-md border px-3 py-3 font-mono text-[18px] tracking-[0.22em]"
                    >
                      {referral.code}
                    </p>
                    <IconButton
                      label={codeCopied ? t('copied') : t('referralCopy')}
                      onClick={() => void copyReferralCode()}
                      className="border-border bg-bg border"
                    >
                      {codeCopied ? (
                        <Check className="text-success size-5" strokeWidth={2} />
                      ) : (
                        <Copy className="size-5" strokeWidth={1.75} />
                      )}
                    </IconButton>
                    <IconButton
                      label={t('referralShare')}
                      onClick={() => void shareReferral()}
                      className="border-border bg-bg border"
                    >
                      <Share2 className="size-5" strokeWidth={1.75} />
                    </IconButton>
                  </div>
                  <p className="text-text-secondary mt-3 text-[13px]">
                    {t('referralProgress', {
                      count: referral.count,
                      needed: referral.needed,
                    })}
                  </p>
                  <div
                    className="mt-2 flex gap-1.5"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={2}
                    aria-valuenow={referral.progress}
                    aria-label={t('referralProgress', {
                      count: referral.count,
                      needed: referral.needed,
                    })}
                  >
                    {[0, 1].map((slot) => (
                      <div
                        key={slot}
                        className={cn(
                          'h-1.5 flex-1 rounded-full',
                          referral.progress > slot ? 'bg-accent' : 'bg-border',
                        )}
                      />
                    ))}
                  </div>
                  {referral.bonusYears > 0 ? (
                    <p className="text-accent mt-2 text-[13px] font-medium">
                      {t('referralBonus', { count: referral.bonusYears })}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
