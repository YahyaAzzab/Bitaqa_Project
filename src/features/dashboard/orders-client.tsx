'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { OrdersBoard } from '@/features/orders/orders-board';
import type { OrderCardData } from '@/features/orders/order-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale } from '@/i18n/config';
import { publicSiteUrl } from '@/lib/site-url';

export function OrdersClient() {
  const locale = useLocale() as Locale;
  const [orders, setOrders] = useState<OrderCardData[] | null>(null);
  const siteUrl = publicSiteUrl();

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/dashboard/orders')
      .then(async (res) => {
        if (!res.ok) throw new Error('fail');
        return res.json() as Promise<{ orders: OrderCardData[] }>;
      })
      .then((json) => {
        if (!cancelled) setOrders(json.orders);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!orders) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
    );
  }

  return <OrdersBoard orders={orders} locale={locale} siteUrl={siteUrl} />;
}
