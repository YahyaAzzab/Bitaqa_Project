import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { DashboardShell } from '@/features/dashboard/dashboard-shell';
import { RegisterSW } from '@/features/pwa/register-sw';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return (
    <DashboardShell>
      {children}
      <RegisterSW />
    </DashboardShell>
  );
}
