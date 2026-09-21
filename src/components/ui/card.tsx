import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md';
};

export function Card({ className, padding = 'md', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'border-border bg-surface rounded-md border',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-4',
        className,
      )}
      {...props}
    />
  );
}
