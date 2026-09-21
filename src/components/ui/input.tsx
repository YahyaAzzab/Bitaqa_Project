'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, trailing, className, disabled, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <label className="flex w-full flex-col gap-1.5" htmlFor={inputId}>
      {label ? (
        <span className="text-text-secondary text-[13px] font-medium tracking-wide">{label}</span>
      ) : null}
      <span className="relative block">
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'focus-ring bg-surface text-text placeholder:text-text-muted h-12 w-full rounded-md border px-3 transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)] outline-none',
            error ? 'border-error' : 'border-border focus:border-accent',
            trailing && 'pe-12',
            disabled && 'opacity-40',
            className,
          )}
          {...props}
        />
        {trailing ? (
          <span className="text-text-muted absolute inset-y-0 end-1 flex items-center">
            {trailing}
          </span>
        ) : null}
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
