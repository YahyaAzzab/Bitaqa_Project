'use client';

import { Check, Pipette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PROFILE_THEMES, type ThemeDefinition, type ThemeName } from '@/lib/profile/themes';
import { cn } from '@/lib/utils';

type Props = {
  value: ThemeName;
  onChange: (theme: ThemeDefinition) => void;
};

export function ThemePicker({ value, onChange }: Props) {
  const t = useTranslations('dashboard.wizard');

  return (
    <div
      role="radiogroup"
      aria-label={t('theme')}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {PROFILE_THEMES.map((theme) => {
        const selected = theme.id === value;
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(theme)}
            className={cn(
              'pressable focus-ring rounded-lg p-1 text-start transition-colors duration-[150ms]',
              selected
                ? 'bg-accent/10 ring-accent ring-2'
                : 'ring-border hover:ring-accent/40 ring-1',
            )}
          >
            {/* Rendered inside the theme itself so the swatch is the real palette. */}
            <span
              data-theme={theme.id}
              className="border-border bg-bg block rounded-md border p-3"
              aria-hidden
            >
              <span className="flex items-center gap-2">
                <span className="border-border bg-surface-raised flex size-7 shrink-0 items-center justify-center rounded-[6px] border">
                  <span className="bg-accent size-2.5 rounded-full" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="bg-text block h-1.5 w-3/4 rounded-full" />
                  <span className="bg-text-muted block h-1.5 w-1/2 rounded-full" />
                </span>
              </span>
              <span className="border-border bg-surface mt-3 block h-5 rounded-[4px] border" />
              <span className="bg-accent mt-2 block h-5 rounded-[4px]" />
            </span>
            <span className="flex min-h-8 items-center justify-between gap-2 px-1.5 pt-1.5">
              <span className="text-text truncate text-[13px] font-medium">
                {t(`themeNames.${theme.id}`)}
              </span>
              {selected ? (
                <Check className="text-accent size-4 shrink-0" strokeWidth={2} aria-hidden />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type AccentChoicesProps = {
  label: string;
  customLabel: string;
  value: string;
  swatches: { hex: string; label: string }[];
  onChange: (hex: string) => void;
};

export function AccentChoices({
  label,
  customLabel,
  value,
  swatches,
  onChange,
}: AccentChoicesProps) {
  const unique = swatches.filter(
    (swatch, index) =>
      swatches.findIndex((other) => other.hex.toLowerCase() === swatch.hex.toLowerCase()) === index,
  );
  const isCustom = !unique.some((swatch) => swatch.hex.toLowerCase() === value.toLowerCase());

  return (
    <div>
      <p id="accent-label" className="text-text-secondary mb-2 text-[13px] font-medium">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby="accent-label"
        className="flex flex-wrap items-center gap-2"
      >
        {unique.map((swatch) => {
          const selected = swatch.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={swatch.hex}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(swatch.hex)}
              className={cn(
                'pressable focus-ring border-border bg-surface inline-flex min-h-12 items-center gap-2 rounded-full border ps-1.5 pe-4 text-[13px] font-medium',
                selected && 'border-accent',
              )}
            >
              <span
                className="border-border size-9 rounded-full border"
                style={{ backgroundColor: swatch.hex }}
                aria-hidden
              />
              {swatch.label}
            </button>
          );
        })}
        <label
          className={cn(
            'pressable focus-within:outline-accent border-border bg-surface relative inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border ps-1.5 pe-4 text-[13px] font-medium focus-within:outline-2 focus-within:outline-offset-2',
            isCustom && 'border-accent',
          )}
        >
          <span
            className="border-border flex size-9 items-center justify-center rounded-full border"
            style={isCustom ? { backgroundColor: value } : undefined}
            aria-hidden
          >
            {isCustom ? null : (
              <Pipette className="text-text-secondary size-4" strokeWidth={1.75} />
            )}
          </span>
          {customLabel}
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={customLabel}
          />
        </label>
      </div>
    </div>
  );
}
