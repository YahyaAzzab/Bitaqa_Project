import { setRequestLocale } from 'next-intl/server';
import { HomeClient } from '@/features/dashboard/home-client';
import type { Locale } from '@/i18n/config';

export default async function DashboardHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <HomeClient />;
}
