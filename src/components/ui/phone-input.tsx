'use client';

import { useId, type InputHTMLAttributes } from 'react';
import { formatNationalDisplay, normalizeMoroccanPhone, toNationalDigits } from '@/lib/phone';
import { cn } from '@/lib/utils';

type PhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  label?: string;
  hint?: string;
  error?: string;
  value: string;
  onValueChange: (e164: string) => void;
};

export function PhoneInput({
  id,
  label,
  hint,
  error,
  value,
  onValueChange,
  disabled,
  name,
  className,
  ...props
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const national = toNationalDigits(value);
  const display = formatNationalDisplay(national);
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="text-text-secondary text-[13px] font-medium tracking-wide"
        >
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          'bg-surface flex h-12 overflow-hidden rounded-md border transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          error ? 'border-error' : 'border-border focus-within:border-accent',
          disabled && 'opacity-40',
        )}
      >
        <span
          className="border-border text-text-secondary flex min-w-16 items-center justify-center border-e px-3 text-[15px] font-medium"
          dir="ltr"
        >
          +212
        </span>
        <input
          {...props}
          id={inputId}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          enterKeyHint="next"
          dir="ltr"
          disabled={disabled}
          value={display}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          onChange={(event) => {
            const next = toNationalDigits(event.target.value);
            const e164 = normalizeMoroccanPhone(`0${next}`);
            onValueChange(e164 ?? (next ? `+212${next}` : ''));
          }}
          className={cn(
            'focus-ring text-text placeholder:text-text-muted h-full min-w-0 flex-1 bg-transparent px-3 outline-none',
            className,
          )}
        />
      </div>
      {error ? (
        <p id={errorId} className="text-error text-[13px]">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-text-muted text-[13px]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
