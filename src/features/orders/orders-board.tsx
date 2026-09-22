'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Receipt } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { EmptyState } from '@/components/ui/empty-state';
import { OrderCard, type OrderCardData } from '@/features/orders/order-card';
import type { OrderStatus } from '@/lib/supabase/database.types';
import type { Locale } from '@/i18n/config';

const FILTERS = ['ordered', 'in_production', 'ready', 'swapped'] as const satisfies readonly OrderStatus[];

type Filter = (typeof FILTERS)[number];

type Props = {
  orders: OrderCardData[];
  locale: Locale;
  siteUrl: string;
};

export function OrdersBoard({ orders, locale, siteUrl }: Props) {
  const t = useTranslations('dashboard.orders');
  const [filter, setFilter] = useState<Filter>('ordered');

  const segments = useMemo(
    () =>
      FILTERS.map((value) => ({
        value,
        label: t(value),
      })),
    [t],
  );

  const visible = orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <SegmentedControl
        value={filter}
        onChange={setFilter}
        segments={segments}
        ariaLabel={t('title')}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-5" strokeWidth={1.75} aria-hidden />}
          title={t('empty')}
          description={t('empty')}
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => (
            <li key={order.id}>
              <OrderCard
                order={order}
                locale={locale}
                profileUrl={`${siteUrl.replace(/\/$/, '')}/${locale}/${order.profile.slug}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
