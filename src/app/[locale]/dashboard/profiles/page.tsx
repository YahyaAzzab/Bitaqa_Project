import { setRequestLocale } from 'next-intl/server';
import { ProfilesClient } from '@/features/dashboard/profiles-client';
import type { Locale } from '@/i18n/config';

export default async function ProfilesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <ProfilesClient />;
}
