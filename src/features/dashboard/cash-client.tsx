'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import { CashChart } from '@/features/cash/cash-chart';
import { HandoverForm } from '@/features/cash/handover-form';
import { Skeleton } from '@/components/ui/skeleton';
import {
  computePeriodTotals,
  getPeriodBounds,
  groupSalesByDay,
  type SaleAmountRow,
} from '@/lib/dashboard/cash';
import { formatMad } from '@/lib/money';
import type { Locale } from '@/i18n/config';
import type { SaleKind } from '@/lib/supabase/database.types';

type SaleRow = SaleAmountRow & {
  id: string;
  kind: SaleKind;
  collected_at: string;
  profiles: { business_name_fr: string; business_name_ar: string | null } | null;
};

type BalanceRow = {
  seller_id: string | null;
  full_name: string | null;
  collected_mad: number | null;
  handed_over_mad: number | null;
  to_hand_over_mad: number | null;
};

type CashPayload = {
  sales: SaleRow[];
  balances: BalanceRow[];
  sellers: Array<{ id: string; full_name: string }>;
  isAdmin: boolean;
};

export function CashClient() {
  const t = useTranslations('dashboard.cash');
  const locale = useLocale() as Locale;
  const [data, setData] = useState<CashPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/dashboard/cash')
      .then(async (res) => {
        if (!res.ok) throw new Error('fail');
        return res.json() as Promise<CashPayload>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) {
          setData({ sales: [], balances: [], sellers: [], isAdmin: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    );
  }

  const totals = computePeriodTotals(data.sales);
  const chartData = groupSalesByDay(data.sales, 30);
  const exportHref = `/api/cash/export?from=${encodeURIComponent(
    getPeriodBounds().monthStart.toISOString().slice(0, 10),
  )}&to=${encodeURIComponent(new Date().toISOString().slice(0, 10))}`;

  return (
    <>
      <section className="grid grid-cols-3 gap-2" aria-label={t('title')}>
        {(
          [
            ['today', totals.today],
            ['week', totals.week],
            ['month', totals.month],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className="border-border bg-surface rounded-lg border p-3">
            <p className="text-text-muted text-[11px] tracking-wide uppercase">{t(key)}</p>
            <p className="tabular mt-2 text-[15px] font-semibold leading-tight sm:text-[17px]">
              {formatMad(value, locale)}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-5">
        <CashChart data={chartData} locale={locale} label={t('chart')} />
      </div>

      {data.isAdmin && data.balances.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
            {t('balance')}
          </h2>
          <ul className="mt-2 space-y-2">
            {data.balances.map((b) => (
              <li
                key={b.seller_id ?? b.full_name}
                className="border-border bg-surface rounded-md border px-3 py-3"
              >
                <p className="text-[14px] font-medium">{b.full_name}</p>
                <dl className="text-text-secondary mt-2 grid grid-cols-3 gap-2 text-[12px]">
                  <div>
                    <dt>{t('collected')}</dt>
                    <dd className="tabular text-text mt-0.5 font-medium">
                      {formatMad(b.collected_mad ?? 0, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('handed')}</dt>
                    <dd className="tabular text-text mt-0.5 font-medium">
                      {formatMad(b.handed_over_mad ?? 0, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('balance')}</dt>
                    <dd className="tabular text-accent mt-0.5 font-semibold">
                      {formatMad(b.to_hand_over_mad ?? 0, locale)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          {data.sellers.length > 0 ? <HandoverForm sellers={data.sellers} /> : null}
          <a
            href={exportHref}
            className="pressable focus-ring border-border bg-surface mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border text-[14px] font-medium"
          >
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            {t('export')}
          </a>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
          {t('sales')}
        </h2>
        {data.sales.length === 0 ? (
          <p className="text-text-secondary mt-3 text-[14px]">{t('sales')}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.sales.map((sale) => {
              const business =
                locale === 'ar'
                  ? sale.profiles?.business_name_ar || sale.profiles?.business_name_fr
                  : sale.profiles?.business_name_fr;
              const date = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', {
                day: 'numeric',
                month: 'short',
              }).format(new Date(sale.collected_at));
              return (
                <li
                  key={sale.id}
                  className="border-border bg-surface flex min-h-14 items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">{business ?? '—'}</p>
                    <p className="text-text-muted text-[12px]">
                      {t(`kind.${sale.kind}`)} · {date}
                    </p>
                  </div>
                  <p className="tabular shrink-0 text-[14px] font-semibold">
                    {formatMad(sale.amount_mad, locale)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
