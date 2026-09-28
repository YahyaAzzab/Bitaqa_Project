'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { updateProfile } from '@/features/profiles/actions';
import { LogoPicker } from '@/features/wizard/logo-picker';
import { useRouter } from '@/i18n/navigation';

type Props = {
  profileId: string;
  businessName: string;
  logoUrl: string | null;
};

export function ProfileLogoEditor({ profileId, businessName, logoUrl }: Props) {
  const t = useTranslations('dashboard.profiles');
  const { toast } = useToast();
  const router = useRouter();
  const [current, setCurrent] = useState(logoUrl);

  const save = async (url: string) => {
    const previous = current;
    setCurrent(url);
    const res = await updateProfile({ profileId, logoUrl: url });
    if (!res.ok) {
      setCurrent(previous);
      toast({ title: t('logoSaveFailed'), variant: 'error' });
      return;
    }
    toast({ title: t('logoSaved'), variant: 'success' });
    router.refresh();
  };

  return (
    <section className="border-border bg-surface rounded-lg border p-4">
      <LogoPicker
        logoUrl={current}
        businessName={businessName}
        onUploaded={(url) => void save(url)}
      />
    </section>
  );
}
