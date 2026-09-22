'use client';

import { Check, Copy, QrCode, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';

type Props = {
  url: string;
  title: string;
};

export function ProfileShareControls({ url, title }: Props) {
  const t = useTranslations('profile');
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!qrOpen) return;
    let cancelled = false;
    void QRCode.toDataURL(url, {
      margin: 2,
      width: 280,
      color: { dark: '#1a1612', light: '#f5f0eb' },
    }).then((data) => {
      if (!cancelled) setQrDataUrl(data);
    });
    return () => {
      cancelled = true;
    };
  }, [qrOpen, url]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: t('linkCopied'), variant: 'success' });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: t('copyFailed'), variant: 'error' });
    }
  }, [toast, t, url]);

  const share = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* annulé */
      }
    }
    await copy();
  }, [copy, title, url]);

  return (
    <>
      <div className="flex items-center gap-2">
        <IconButton label={t('share')} onClick={() => void share()}>
          <Share2 className="size-5" strokeWidth={1.75} />
        </IconButton>
        <IconButton label={t('showQr')} onClick={() => setQrOpen(true)}>
          <QrCode className="size-5" strokeWidth={1.75} />
        </IconButton>
        <IconButton label={t('copyLink')} onClick={() => void copy()}>
          {copied ? (
            <Check className="size-5 text-success" strokeWidth={1.75} />
          ) : (
            <Copy className="size-5" strokeWidth={1.75} />
          )}
        </IconButton>
      </div>

      <Sheet
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title={t('qrTitle')}
        closeLabel={t('close')}
      >
        <div className="flex flex-col items-center gap-4 pb-6">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="" width={280} height={280} className="rounded-md" />
          ) : (
            <div className="bg-surface size-[280px] animate-pulse rounded-md" />
          )}
          <p className="text-text-secondary text-center text-[14px]" dir="ltr">
            {url}
          </p>
          <Button type="button" variant="secondary" className="w-full" onClick={() => void copy()}>
            {copied ? t('copied') : t('copyLink')}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
