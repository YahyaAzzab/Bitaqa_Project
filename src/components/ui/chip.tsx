'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChipProps = {
  children: string;
  selected?: boolean;
  onSelect?: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
  disabled?: boolean;
};

export function Chip({
  children,
  selected = false,
  onSelect,
  onDismiss,
  dismissLabel = 'Retirer',
  disabled = false,
}: ChipProps) {
  const interactive = Boolean(onSelect) && !disabled;

  return (
    <span
      className={cn(
        'inline-flex min-h-10 items-center gap-1 rounded-full border px-3 text-sm transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        selected
          ? 'border-accent bg-accent/15 text-accent'
          : 'border-border bg-surface text-text-secondary',
        interactive && 'pressable focus-ring hover:border-accent/50 cursor-pointer',
        disabled && 'opacity-40',
      )}
    >
      {interactive ? (
        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          className="focus-ring rounded-full"
        >
          {children}
        </button>
      ) : (
        children
      )}
      {onDismiss ? (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          disabled={disabled}
          className="focus-ring text-text-muted hover:text-text -me-1 inline-flex size-8 items-center justify-center rounded-full"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      ) : null}
    </span>
  );
}
