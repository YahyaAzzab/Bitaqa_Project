import { setRequestLocale } from 'next-intl/server';
import { OrdersClient } from '@/features/dashboard/orders-client';
import type { Locale } from '@/i18n/config';

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <OrdersClient />;
}
