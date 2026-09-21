'use client';

import { ChevronDown } from 'lucide-react';
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, hint, error, options, placeholder, className, disabled, ...props },
  ref,
) {
  const selectId = id ?? props.name;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <label className="flex w-full flex-col gap-1.5" htmlFor={selectId}>
      {label ? (
        <span className="text-text-secondary text-[13px] font-medium tracking-wide">{label}</span>
      ) : null}
      <span className="relative block">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'focus-ring bg-surface text-text h-12 w-full appearance-none rounded-md border px-3 pe-11 transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)] outline-none',
            error ? 'border-error' : 'border-border focus:border-accent',
            disabled && 'opacity-40',
            className,
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="text-text-muted pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
          strokeWidth={1.75}
        />
      </span>
      {error ? (
        <span id={errorId} className="text-error text-[13px]">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="text-text-muted text-[13px]">
          {hint}
        </span>
      ) : null}
    </label>
  );
});
