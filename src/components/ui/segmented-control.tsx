'use client';

import { cn } from '@/lib/utils';

type Segment<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  segments: Segment<T>[];
  ariaLabel: string;
};

export function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    segments.findIndex((segment) => segment.value === value),
  );
  const count = segments.length || 1;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="border-border bg-surface relative grid min-h-12 rounded-md border p-1"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="bg-surface-raised absolute top-1 bottom-1 rounded-sm transition-[inset-inline-start] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `calc((100% - 8px) / ${count})`,
          insetInlineStart: `calc(4px + ${activeIndex} * ((100% - 8px) / ${count}))`,
        }}
      />
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <button
            key={segment.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn(
              'focus-ring relative z-10 min-h-10 rounded-sm px-2 text-sm font-medium transition-colors duration-[150ms]',
              selected ? 'text-text' : 'text-text-muted hover:text-text-secondary',
            )}
            onClick={() => onChange(segment.value)}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
