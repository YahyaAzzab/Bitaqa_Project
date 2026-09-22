import { setRequestLocale } from 'next-intl/server';
import { WizardForm } from '@/features/wizard/wizard-form';
import type { Locale } from '@/i18n/config';

export default async function NewProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  setRequestLocale(raw as Locale);
  return <WizardForm />;
}
