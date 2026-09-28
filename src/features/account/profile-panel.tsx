'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Switch } from '@/components/ui/switch';
import { uploadOwnLogo } from '@/features/account/actions';
import { HoursEditor } from '@/features/wizard/hours-editor';
import { LogoPicker } from '@/features/wizard/logo-picker';
import type { OwnerProfileValues } from '@/lib/profile/schema';

type Props = {
  form: UseFormReturn<OwnerProfileValues>;
  fieldError: (message: string | undefined) => string | undefined;
  onLogoAccent: (hex: string) => void;
};

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-text-muted text-[12px] font-medium tracking-[0.14em] uppercase">
          {title}
        </h3>
        {hint ? <p className="text-text-muted mt-1 text-[13px]">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ProfilePanel({ form, fieldError, onLogoAccent }: Props) {
  const t = useTranslations('account.profile');
  const tWizard = useTranslations('dashboard.wizard');
  const { control, register, setValue, formState } = form;
  const errors = formState.errors;
  const [businessName, logoUrl, whatsappSame, hoursEnabled] = useWatch({
    control,
    name: ['businessNameFr', 'logoUrl', 'whatsappSame', 'hoursEnabled'],
  });

  return (
    <div className="space-y-10">
      <Section title={t('identity')}>
        <div className="border-border bg-surface rounded-lg border p-4">
          <LogoPicker
            logoUrl={logoUrl}
            businessName={businessName || 'B'}
            upload={uploadOwnLogo}
            onUploaded={(url, accent) => {
              setValue('logoUrl', url, { shouldDirty: true });
              if (accent) onLogoAccent(accent);
            }}
          />
        </div>
        <Input
          label={t('nameFr')}
          className="text-[16px]"
          autoComplete="organization"
          enterKeyHint="next"
          maxLength={80}
          {...register('businessNameFr')}
          error={fieldError(errors.businessNameFr?.message)}
        />
        <Input
          label={t('nameAr')}
          className="text-[16px]"
          dir="rtl"
          lang="ar"
          enterKeyHint="next"
          maxLength={80}
          {...register('businessNameAr')}
          error={fieldError(errors.businessNameAr?.message)}
        />
        <Input
          label={t('taglineFr')}
          hint={t('taglineHint')}
          className="text-[16px]"
          enterKeyHint="next"
          maxLength={120}
          {...register('taglineFr')}
          error={fieldError(errors.taglineFr?.message)}
        />
        <Input
          label={t('taglineAr')}
          className="text-[16px]"
          dir="rtl"
          lang="ar"
          enterKeyHint="next"
          maxLength={120}
          {...register('taglineAr')}
          error={fieldError(errors.taglineAr?.message)}
        />
      </Section>

      <Section title={t('contact')} hint={t('contactHint')}>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              label={t('phone')}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldError(errors.phone?.message)}
              className="text-[16px]"
            />
          )}
        />
        <div className="border-border bg-surface rounded-lg border px-4 py-3">
          <Controller
            control={control}
            name="whatsappSame"
            render={({ field }) => (
              <Switch
                id="owner-wa-same"
                label={t('whatsappSame')}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
        {!whatsappSame ? (
          <Controller
            control={control}
            name="whatsapp"
            render={({ field }) => (
              <PhoneInput
                label={t('whatsapp')}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(errors.whatsapp?.message)}
                className="text-[16px]"
              />
            )}
          />
        ) : null}
        <Input
          label={t('email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          className="text-[16px]"
          {...register('email')}
          error={fieldError(errors.email?.message)}
        />
        <Input
          label={t('address')}
          autoComplete="street-address"
          className="text-[16px]"
          maxLength={200}
          {...register('addressFr')}
          error={fieldError(errors.addressFr?.message)}
        />
        <Input
          label={t('maps')}
          hint={t('mapsHint')}
          type="url"
          inputMode="url"
          dir="ltr"
          className="text-[16px]"
          {...register('mapsUrl')}
          error={fieldError(errors.mapsUrl?.message)}
        />
      </Section>

      <Section title={tWizard('hours')}>
        <div className="border-border bg-surface rounded-lg border px-4 py-3">
          <Controller
            control={control}
            name="hoursEnabled"
            render={({ field }) => (
              <Switch
                id="owner-hours"
                label={tWizard('hours')}
                description={tWizard('hoursHint')}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
        {hoursEnabled ? (
          <Controller
            control={control}
            name="hours"
            render={({ field }) => <HoursEditor value={field.value} onChange={field.onChange} />}
          />
        ) : null}
      </Section>
    </div>
  );
}
