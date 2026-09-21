import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SpinnerProps = {
  className?: string;
  size?: number;
};

export function Spinner({ className, size = 18 }: SpinnerProps) {
  return (
    <Loader2 aria-hidden className={cn('animate-spin', className)} size={size} strokeWidth={1.75} />
  );
}
