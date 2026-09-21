import { cn } from '@/lib/utils';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div aria-hidden className={cn('bg-surface-raised animate-pulse rounded-md', className)} />
  );
}
