import { setRequestLocale } from 'next-intl/server';
import { CashClient } from '@/features/dashboard/cash-client';
import type { Locale } from '@/i18n/config';

export default async function CashPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <CashClient />;
}
