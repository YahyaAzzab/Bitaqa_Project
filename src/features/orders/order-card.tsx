'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Phone, MessageCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { advanceOrderStatus, type AdvanceOrderState } from '@/features/orders/actions';
import { isForwardSkip, nextFlowStatus, type FlowStatus } from '@/lib/dashboard/orders';
import type { OrderStatus } from '@/lib/supabase/database.types';
import type { Locale } from '@/i18n/config';

export type OrderCardData = {
  id: string;
  status: OrderStatus;
  design_notes: string | null;
  logo_url: string | null;
  ordered_at: string;
  profile: {
    id: string;
    slug: string;
    business_name_fr: string;
    business_name_ar: string | null;
    phone: string | null;
  };
};

type Props = {
  order: OrderCardData;
  locale: Locale;
  profileUrl: string;
};

const initial: AdvanceOrderState = {};

function whatsappHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export function OrderCard({ order, locale, profileUrl }: Props) {
  const t = useTranslations('dashboard.orders');
  const tProfile = useTranslations('profile');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState(advanceOrderStatus, initial);
  const [, startTransition] = useTransition();

  const name =
    locale === 'ar'
      ? order.profile.business_name_ar || order.profile.business_name_fr
      : order.profile.business_name_fr;

  const next = nextFlowStatus(order.status);

  useEffect(() => {
    if (state.ok) {
      toast({ title: tCommon('save'), variant: 'success' });
    } else if (state.error === 'skip_required') {
      toast({ title: t('confirmSkip'), variant: 'error' });
    } else if (state.error) {
      toast({ title: tCommon('error'), variant: 'error' });
    }
  }, [state, toast, t, tCommon]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({ title: tProfile('linkCopied'), variant: 'success' });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: tProfile('copyFailed'), variant: 'error' });
    }
  };

  const submitAdvance = (target: FlowStatus) => {
    const skip = isForwardSkip(order.status, target);
    if (skip && !window.confirm(t('confirmSkip'))) {
      return;
    }
    const fd = new FormData();
    fd.set('orderId', order.id);
    fd.set('targetStatus', target);
    fd.set('confirmSkip', skip ? 'true' : 'false');
    startTransition(() => {
      action(fd);
    });
  };

  return (
    <article className="border-border bg-surface rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold tracking-tight">{name}</h3>
          <p className="text-text-muted mt-0.5 text-[12px]" dir="ltr">
            /{order.profile.slug}
          </p>
        </div>
        <Badge tone={order.status === 'ready' ? 'warning' : 'muted'}>
          {t(order.status)}
        </Badge>
      </div>

      {order.design_notes ? (
        <p className="text-text-secondary mt-3 text-[13px] leading-relaxed">{order.design_notes}</p>
      ) : null}

      {order.profile.phone ? (
        <div className="mt-3 flex gap-2">
          <a
            href={`tel:${order.profile.phone}`}
            className="pressable focus-ring border-border bg-bg inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border text-[13px] font-medium"
            dir="ltr"
          >
            <Phone className="size-4" strokeWidth={1.75} aria-hidden />
            {tProfile('call')}
          </a>
          <a
            href={whatsappHref(order.profile.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable focus-ring border-border bg-bg inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border text-[13px] font-medium"
            dir="ltr"
          >
            <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden />
            {tProfile('whatsapp')}
          </a>
        </div>
      ) : null}

      {order.status === 'ready' ? (
        <div className="border-border mt-3 rounded-md border border-dashed p-3">
          <p className="text-text-muted text-[11px] font-medium tracking-wide uppercase">
            {t('rewriteLink')}
          </p>
          <p className="mt-1 truncate text-[13px] font-medium" dir="ltr">
            {profileUrl}
          </p>
          <p className="text-text-secondary mt-2 text-[12px] leading-relaxed">{t('nfcHint')}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3 w-full"
            onClick={() => void copyLink()}
          >
            {copied ? (
              <Check className="size-4 text-success" strokeWidth={1.75} />
            ) : (
              <Copy className="size-4" strokeWidth={1.75} />
            )}
            {t('copyLink')}
          </Button>
        </div>
      ) : null}

      {next ? (
        <Button
          type="button"
          className="mt-3 w-full"
          loading={pending}
          onClick={() => submitAdvance(next)}
        >
          {t('advance', { status: t(next) })}
        </Button>
      ) : null}
    </article>
  );
}
