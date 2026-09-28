'use client';

import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import type { OwnerScanStats } from '@/features/account/load-profile';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const DAYS = 30;

function lastDays(daily: OwnerScanStats['daily']): Array<{ day: string; count: number }> {
  const counts = new Map(daily.map((d) => [d.day.slice(0, 10), d.count]));
  const today = new Date();
  return Array.from({ length: DAYS }, (_, i) => {
    const date = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (DAYS - 1 - i)),
    );
    const key = date.toISOString().slice(0, 10);
    return { day: key, count: counts.get(key) ?? 0 };
  });
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <p className="text-text-muted text-[12px] font-medium">{label}</p>
      <p className="tabular mt-2 text-[28px] leading-none font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  total,
}: {
  title: string;
  rows: Array<[string, number]>;
  total: number;
}) {
  if (rows.length === 0) return null;
  return (
    <section>
      <h3 className="text-text-muted text-[12px] font-medium tracking-[0.14em] uppercase">
        {title}
      </h3>
      <ul className="mt-3 space-y-3">
        {rows.slice(0, 5).map(([label, count]) => {
          const share = total > 0 ? count / total : 0;
          return (
            <li key={label}>
              <div className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="truncate">{label}</span>
                <span className="tabular text-text-secondary">{count}</span>
              </div>
              <div className="bg-surface-raised mt-1.5 h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-accent h-full rounded-full ltr:origin-left rtl:origin-right"
                  style={{ width: '100%', transform: `scaleX(${share})` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function StatsPanel({ stats }: { stats: OwnerScanStats }) {
  const t = useTranslations('account.stats');
  const locale = useLocale();
  const reduced = useReducedMotion();
  const series = useMemo(() => lastDays(stats.daily), [stats.daily]);
  const max = Math.max(1, ...series.map((d) => d.count));

  const regionNames = useMemo(
    () => new Intl.DisplayNames([locale === 'ar' ? 'ar' : 'fr'], { type: 'region' }),
    [locale],
  );
  const countries = stats.byCountry.map(([code, count]): [string, number] => {
    if (code.length !== 2) return [t('unknown'), count];
    try {
      return [regionNames.of(code.toUpperCase()) ?? code, count];
    } catch {
      return [code, count];
    }
  });
  const devices = stats.byDevice.map(([key, count]): [string, number] => [
    key === 'mobile' || key === 'tablet' || key === 'desktop' ? t(`device.${key}`) : t('unknown'),
    count,
  ]);

  if (stats.scans30 === 0) {
    return (
      <EmptyState
        icon={<Radio className="size-6" strokeWidth={1.5} />}
        title={t('emptyTitle')}
        description={t('emptyBody')}
      />
    );
  }

  const summary = series
    .filter((d) => d.count > 0)
    .map((d) => `${d.day}: ${d.count}`)
    .join(', ');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3">
        <Kpi label={t('last7')} value={stats.scans7} />
        <Kpi label={t('last30')} value={stats.scans30} />
      </div>

      <figure className="border-border bg-surface rounded-lg border p-4">
        <figcaption className="text-text-muted text-[12px] font-medium tracking-[0.14em] uppercase">
          {t('chart')}
        </figcaption>
        <p className="sr-only">{summary}</p>
        <div aria-hidden className="mt-4 flex h-28 items-end gap-[3px]">
          {series.map((d, i) => (
            <motion.span
              key={d.day}
              className={
                d.count > 0
                  ? 'bg-accent/85 flex-1 rounded-t-[2px]'
                  : 'bg-border flex-1 rounded-t-[2px]'
              }
              style={{ height: '100%', originY: 1 }}
              initial={reduced ? false : { scaleY: 0 }}
              animate={{ scaleY: d.count > 0 ? Math.max(d.count / max, 0.04) : 0.02 }}
              transition={{
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
                delay: reduced ? 0 : i * 0.008,
              }}
            />
          ))}
        </div>
        <div className="text-text-muted mt-2 flex justify-between text-[11px]">
          <span>{t('daysAgo', { count: DAYS })}</span>
          <span>{t('today')}</span>
        </div>
      </figure>

      <Breakdown title={t('countries')} rows={countries} total={stats.scans30} />
      <Breakdown title={t('devices')} rows={devices} total={stats.scans30} />
    </div>
  );
}
