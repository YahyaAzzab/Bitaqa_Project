import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex min-h-6 items-center rounded-sm px-2 text-[11px] font-medium tracking-wide uppercase',
  {
    variants: {
      tone: {
        accent: 'bg-accent/15 text-accent',
        success: 'bg-success/15 text-success',
        error: 'bg-error/15 text-error',
        warning: 'bg-warning/15 text-warning',
        muted: 'bg-surface-raised text-text-secondary',
      },
    },
    defaultVariants: {
      tone: 'muted',
    },
  },
);

type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: string;
  className?: string;
};

export function Badge({ tone, children, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}
