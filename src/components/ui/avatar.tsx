import Image from 'next/image';
import { cn } from '@/lib/utils';

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase() || '·';
}

export function Avatar({ name, src, size = 48, className }: AvatarProps) {
  const initials = initialsFromName(name);

  return (
    <span
      className={cn(
        'border-border bg-surface-raised text-accent relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border',
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={name}
    >
      {src ? (
        <Image src={src} alt="" width={size} height={size} className="size-full object-cover" />
      ) : (
        <span className="text-sm font-semibold tracking-wide" aria-hidden>
          {initials}
        </span>
      )}
    </span>
  );
}
