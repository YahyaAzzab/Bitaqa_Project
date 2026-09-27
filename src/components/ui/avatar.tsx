'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  priority?: boolean;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase() || '·';
}

export function Avatar({ name, src, size = 48, className, priority = false }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const initials = initialsFromName(name);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span
      className={cn(
        'border-border bg-surface-raised text-accent relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border',
        className,
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={name}
    >
      {showImage && src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          priority={priority}
          // The optimizer rejects SVG by default; seed logos are SVG.
          unoptimized={src.toLowerCase().endsWith('.svg')}
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
        />
      ) : (
        <span
          className="font-semibold leading-none tracking-tight"
          style={{ fontSize: Math.round(size * (initials.length > 1 ? 0.34 : 0.42)) }}
          aria-hidden
        >
          {initials}
        </span>
      )}
    </span>
  );
}
