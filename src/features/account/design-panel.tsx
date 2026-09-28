'use client';

import { useTranslations } from 'next-intl';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { AccentChoices, ThemePicker } from '@/features/wizard/theme-picker';
import type { OwnerProfileValues } from '@/lib/profile/schema';
import { themeDefinition } from '@/lib/profile/themes';

type Props = {
  form: UseFormReturn<OwnerProfileValues>;
  logoAccent: string | null;
  savedAccent: string;
};

export function DesignPanel({ form, logoAccent, savedAccent }: Props) {
  const t = useTranslations('dashboard.wizard');
  const tDesign = useTranslations('account.design');
  const { control, setValue } = form;
  const [theme, accentColor] = useWatch({ control, name: ['theme', 'accentColor'] });

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-text-muted text-[12px] font-medium tracking-[0.14em] uppercase">
          {t('theme')}
        </h3>
        <p className="text-text-muted mt-1 mb-4 text-[13px]">{tDesign('themeHint')}</p>
        <ThemePicker
          value={theme}
          onChange={(next) => {
            setValue('theme', next.id, { shouldDirty: true });
            setValue('accentColor', next.accent, { shouldDirty: true, shouldValidate: true });
          }}
        />
      </section>
      <AccentChoices
        label={t('accent')}
        customLabel={t('accentCustom')}
        value={accentColor}
        swatches={[
          { hex: themeDefinition(theme).accent, label: t('accentTheme') },
          { hex: savedAccent, label: tDesign('accentSaved') },
          ...(logoAccent ? [{ hex: logoAccent, label: t('accentLogo') }] : []),
        ]}
        onChange={(hex) =>
          setValue('accentColor', hex, { shouldDirty: true, shouldValidate: true })
        }
      />
    </div>
  );
}
