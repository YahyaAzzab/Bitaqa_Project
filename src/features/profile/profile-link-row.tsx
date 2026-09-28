'use client';

import { ArrowUpRight } from 'lucide-react';
import { LinkIcon } from '@/components/ui/link-icon';
import type { LinkType } from '@/lib/supabase/database.types';
import { isSafeProfileUrl, toMailtoHref, toTelHref } from '@/lib/profile/urls';
import { cn } from '@/lib/utils';

const HANDLE_TYPES: ReadonlySet<LinkType> = new Set(['instagram', 'tiktok', 'facebook']);

type Props = {
  type: LinkType;
  href: string;
  label: string;
};

function resolveHref(type: LinkType, value: string): string | null {
  if (type === 'phone') return toTelHref(value);
  if (type === 'email') return toMailtoHref(value);
  if (type === 'whatsapp') {
    if (value.startsWith('http')) return isSafeProfileUrl(value) ? value : null;
    return `https://wa.me/${value.replace(/\D/g, '')}`;
  }
  return isSafeProfileUrl(value) ? value : null;
}

/** Ce que le visiteur reconnaît : le @pseudo, le domaine ou l’adresse e-mail. */
function linkDetail(type: LinkType, value: string): string | null {
  if (type === 'email') return value;
  if (type === 'maps' || type === 'phone' || type === 'whatsapp') return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    if (HANDLE_TYPES.has(type)) {
      const handle = url.pathname.split('/').filter(Boolean)[0]?.replace(/^@/, '');
      return handle ? `@${handle}` : host;
    }
    return host;
  } catch {
    return null;
  }
}

export function ProfileLinkRow({ type, href, label }: Props) {
  const safe = resolveHref(type, href);
  if (!safe) return null;
  const detail = linkDetail(type, href);
  const external = safe.startsWith('http');

  return (
    <a
      href={safe}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(
        'group pressable focus-ring flex min-h-16 items-center gap-3 px-4 py-3',
        'hover:bg-surface-raised/60 transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
      )}
    >
      <LinkIcon type={type} />
      <span className="min-w-0 flex-1">
        <span className="text-text block truncate text-[15px] font-medium">{label}</span>
        {detail ? (
          <span className="text-text-muted block truncate text-[13px]">
            <bdi dir="ltr">{detail}</bdi>
          </span>
        ) : null}
      </span>
      <ArrowUpRight
        className="text-text-muted group-hover:text-text size-[18px] shrink-0 transition-colors rtl:-scale-x-100"
        strokeWidth={1.75}
        aria-hidden
      />
    </a>
  );
}
