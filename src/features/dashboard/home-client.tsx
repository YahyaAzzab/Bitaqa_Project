'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { LayoutGrid } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMad } from '@/lib/money';
import type { Locale } from '@/i18n/config';

type HomeData = {
  sellerName: string;
  profilesToday: number;
  collectedToday: number;
  recent: Array<{
    id: string;
    slug: string;
    business_name_fr: string;
    business_name_ar: string | null;
    logo_url: string | null;
    status: string;
    plan_code: string;
  }>;
  renewSoon: Array<{ id: string; business_name_fr: string; expires_at: string }>;
  readyOrders: Array<{ id: string; profile_id: string }>;
};

function HomeSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-48" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="h-14 rounded-lg" />
      <Skeleton className="h-14 rounded-lg" />
    </div>
  );
}

export function HomeClient() {
  const t = useTranslations('dashboard');
  const locale = useLocale() as Locale;
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/dashboard/home')
      .then(async (res) => {
        if (!res.ok) throw new Error('fail');
        return res.json() as Promise<HomeData>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-error text-[14px]">{t('hello', { name: '—' })}</p>;
  }

  if (!data) return <HomeSkeleton />;

  return (
    <>
      <p className="text-text-secondary text-[14px]">
        {t('hello', { name: data.sellerName })}
      </p>

      <section className="mt-5 grid grid-cols-2 gap-3" aria-label={t('home.today')}>
        <div className="border-border bg-surface rounded-lg border p-4">
          <p className="text-text-muted text-[12px] tracking-wide uppercase">
            {t('home.profilesCreated')}
          </p>
          <p className="tabular mt-2 text-[28px] font-semibold leading-none">
            {data.profilesToday}
          </p>
        </div>
        <div className="border-border bg-surface rounded-lg border p-4">
          <p className="text-text-muted text-[12px] tracking-wide uppercase">{t('home.collected')}</p>
          <p className="tabular mt-2 text-[22px] font-semibold leading-none">
            {formatMad(data.collectedToday, locale)}
          </p>
        </div>
      </section>

      {(data.renewSoon.length > 0 || data.readyOrders.length > 0) && (
        <section className="mt-6">
          <h2 className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
            {t('home.alerts')}
          </h2>
          <ul className="mt-2 space-y-2">
            {data.readyOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href="/dashboard/orders"
                  className="border-border bg-surface focus-ring flex min-h-12 items-center justify-between rounded-md border px-3 text-[14px]"
                >
                  <span>{t('home.readySwap')}</span>
                  <Badge tone="warning">{t('orders.ready')}</Badge>
                </Link>
              </li>
            ))}
            {data.renewSoon.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/profiles/${p.id}`}
                  className="border-border bg-surface focus-ring flex min-h-12 items-center justify-between gap-2 rounded-md border px-3 text-[14px]"
                >
                  <span className="truncate">{p.business_name_fr}</span>
                  <span className="text-text-muted shrink-0 text-[12px]">{t('home.renewSoon')}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
            {t('home.recent')}
          </h2>
          <Link href="/dashboard/profiles" className="text-accent text-[13px] font-medium">
            {t('home.viewAll')}
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={<LayoutGrid className="size-5" strokeWidth={1.75} />}
              title={t('home.emptyTitle')}
              description={t('home.emptyBody')}
              action={
                <Link
                  href="/dashboard/new"
                  className="pressable focus-ring bg-accent text-accent-fg inline-flex min-h-12 items-center rounded-md px-4 text-[15px] font-medium"
                >
                  {t('home.emptyAction')}
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.recent.map((p) => {
              const name =
                locale === 'ar' ? p.business_name_ar || p.business_name_fr : p.business_name_fr;
              return (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/profiles/${p.id}`}
                    className="pressable border-border bg-surface focus-ring flex min-h-14 items-center gap-3 rounded-lg border px-3"
                  >
                    <Avatar name={name} src={p.logo_url} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{name}</p>
                      <p className="text-text-muted text-[12px]" dir="ltr">
                        /{p.slug}
                      </p>
                    </div>
                    <Badge tone={p.status === 'active' ? 'success' : 'muted'}>{p.plan_code}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
