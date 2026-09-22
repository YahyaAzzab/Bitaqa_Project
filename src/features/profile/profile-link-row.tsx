'use client';

import {
  Facebook,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Music2,
} from 'lucide-react';
import type { LinkType } from '@/lib/supabase/database.types';
import { isSafeProfileUrl, toMailtoHref, toTelHref } from '@/lib/profile/urls';
import { cn } from '@/lib/utils';

const ICONS: Partial<Record<LinkType, typeof Globe>> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
  linkedin: Linkedin,
  website: Globe,
  maps: MapPin,
  email: Mail,
  phone: Phone,
  whatsapp: Phone,
  custom: Link2,
};

type Props = {
  type: LinkType;
  href: string;
  label: string;
  index: number;
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

export function ProfileLinkRow({ type, href, label, index }: Props) {
  const Icon = ICONS[type] ?? Link2;
  const safe = resolveHref(type, href);
  if (!safe) return null;

  return (
    <a
      href={safe}
      target={safe.startsWith('http') ? '_blank' : undefined}
      rel={safe.startsWith('http') ? 'noopener noreferrer' : undefined}
      className={cn(
        'pressable border-border bg-surface focus-ring flex min-h-14 items-center gap-3 rounded-lg border px-4',
        'transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-accent/35',
      )}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <span className="bg-surface-raised text-accent flex size-10 items-center justify-center rounded-md">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{label}</span>
    </a>
  );
}
