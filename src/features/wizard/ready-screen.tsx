'use client';

import { Check, Copy, QrCode } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import QRCode from 'qrcode';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type Props = {
  slug: string;
  businessName: string;
  phone: string | null;
  profileUrl: string;
};

const NFC_KEYS = ['nfc1', 'nfc2', 'nfc3', 'nfc4'] as const;

export function ReadyScreen({ slug, businessName, phone, profileUrl }: Props) {
  const t = useTranslations('dashboard.ready');
  const tProfile = useTranslations('profile');
  const locale = useLocale() as 'fr' | 'ar';
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!qrOpen) return;
    let cancelled = false;
    void QRCode.toDataURL(profileUrl, {
      margin: 2,
      width: 280,
      color: { dark: '#1a1612', light: '#f5f0eb' },
    }).then((data) => {
      if (!cancelled) setQrDataUrl(data);
    });
    return () => {
      cancelled = true;
    };
  }, [qrOpen, profileUrl]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({ title: t('copied'), variant: 'success' });
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: tProfile('copyFailed'), variant: 'error' });
    }
  }, [profileUrl, t, tProfile, toast]);

  const waShare = useCallback(() => {
    const text = encodeURIComponent(`${businessName}\n${profileUrl}`);
    const target = phone
      ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  }, [businessName, phone, profileUrl]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="text-center">
        <div className="border-success/40 bg-success/10 text-success mx-auto flex size-14 items-center justify-center rounded-full border">
          <Check className="size-7" strokeWidth={2} />
        </div>
        <h2 className="mt-4 text-[22px] font-semibold tracking-tight">{t('title')}</h2>
        <p className="text-text-secondary mt-2 text-[14px] leading-relaxed">{t('lede')}</p>
      </div>

      <div className="border-border bg-surface rounded-lg border p-4">
        <p className="text-text-muted text-[11px] tracking-wide uppercase">URL</p>
        <p className="mt-2 break-all text-[17px] font-medium leading-snug" dir="ltr">
          {profileUrl}
        </p>
        <Button className="mt-4 w-full" onClick={() => void copy()}>
          {copied ? (
            <>
              <Check className="size-4" strokeWidth={2} />
              {t('copied')}
            </>
          ) : (
            <>
              <Copy className="size-4" strokeWidth={1.75} />
              {t('copy')}
            </>
          )}
        </Button>
      </div>

      <section>
        <h3 className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
          {t('nfcTitle')}
        </h3>
        <ul className="mt-3 space-y-2">
          {NFC_KEYS.map((key) => {
            const on = Boolean(checked[key]);
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setChecked((c) => ({ ...c, [key]: !c[key] }))}
                  className={cn(
                    'border-border bg-surface pressable focus-ring flex w-full min-h-12 items-center gap-3 rounded-md border px-3 text-start text-[14px]',
                    on && 'border-accent/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-sm border',
                      on ? 'border-accent bg-accent text-accent-fg' : 'border-border',
                    )}
                    aria-hidden
                  >
                    {on ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                  </span>
                  {t(key)}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-text-muted mt-3 text-[13px] leading-relaxed">{t('scanReminder')}</p>
      </section>

      <div className="grid gap-2">
        <Button variant="secondary" onClick={() => window.open(`/${locale}/${slug}`, '_blank')}>
          {t('test')}
        </Button>
        <Button variant="secondary" onClick={() => setQrOpen(true)}>
          <QrCode className="size-4" strokeWidth={1.75} />
          {t('qr')}
        </Button>
        <Button variant="secondary" onClick={waShare}>
          {t('whatsapp')}
        </Button>
        <a
          href={`/api/receipt/${slug}`}
          className="pressable focus-ring border-border bg-surface text-text inline-flex min-h-12 items-center justify-center rounded-md border px-4 text-[15px] font-medium"
        >
          {t('receipt')}
        </a>
        <Link
          href="/dashboard/new"
          className="pressable focus-ring bg-accent text-accent-fg inline-flex min-h-12 items-center justify-center rounded-md px-4 text-[15px] font-medium"
        >
          {t('new')}
        </Link>
      </div>

      <Sheet open={qrOpen} onClose={() => setQrOpen(false)} title={t('qr')} closeLabel={tProfile('close')}>
        <div className="flex flex-col items-center gap-3 py-2">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="" width={280} height={280} className="rounded-md" />
          ) : (
            <div className="bg-surface size-[280px] animate-pulse rounded-md" />
          )}
          <p className="text-text-muted text-center text-[13px]" dir="ltr">
            {profileUrl}
          </p>
        </div>
      </Sheet>
    </div>
  );
}
