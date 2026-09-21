'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, hint, error, className, disabled, rows = 4, ...props },
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
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={cn(
          'focus-ring bg-surface text-text placeholder:text-text-muted min-h-24 w-full resize-y rounded-md border px-3 py-3 transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)] outline-none',
          error ? 'border-error' : 'border-border focus:border-accent',
          disabled && 'opacity-40',
          className,
        )}
        {...props}
      />
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
