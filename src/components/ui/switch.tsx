'use client';

import { cn } from '@/lib/utils';

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  id,
}: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {label ? (
        <label htmlFor={id} className="min-w-0 flex-1">
          <span className="text-text block text-[15px]">{label}</span>
          {description ? (
            <span className="text-text-muted mt-0.5 block text-[13px]">{description}</span>
          ) : null}
        </label>
      ) : null}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'focus-ring relative h-8 w-12 shrink-0 rounded-full border transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          checked ? 'border-accent bg-accent' : 'border-border bg-surface',
          disabled && 'opacity-40',
        )}
      >
        <span
          className={cn(
            'absolute start-0.5 top-0.5 size-6 rounded-full transition-transform duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
            checked ? 'bg-accent-fg translate-x-4 rtl:-translate-x-4' : 'bg-text-secondary',
          )}
        />
      </button>
    </div>
  );
}
