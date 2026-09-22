'use client';

import { LayoutGrid, Phone, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Link } from '@/i18n/navigation';
import type { ProfileStatus } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

export type ProfileListItem = {
  id: string;
  slug: string;
  business_name_fr: string;
  business_name_ar: string | null;
  logo_url: string | null;
  status: ProfileStatus;
  plan_code: string;
  expires_at: string;
  phone: string | null;
};

type Filter = 'all' | 'active' | 'expired' | 'suspended';

type Props = {
  profiles: ProfileListItem[];
};

function statusTone(status: ProfileStatus): 'success' | 'warning' | 'error' | 'muted' {
  if (status === 'active') return 'success';
  if (status === 'expired') return 'warning';
  if (status === 'suspended') return 'error';
  return 'muted';
}

export function ProfilesList({ profiles }: Props) {
  const t = useTranslations('dashboard.profiles');
  const tHome = useTranslations('dashboard.home');
  const locale = useLocale() as 'fr' | 'ar';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (!q) return true;
      const hay = `${p.business_name_fr} ${p.business_name_ar ?? ''} ${p.slug}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filter, profiles, query]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <Input
        label={t('search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-[16px]"
        trailing={<Search className="text-text-muted me-2 size-4" strokeWidth={1.75} />}
      />

      <SegmentedControl
        ariaLabel={t('title')}
        value={filter}
        onChange={setFilter}
        segments={[
          { value: 'all', label: t('filterAll') },
          { value: 'active', label: t('filterActive') },
          { value: 'expired', label: t('filterExpired') },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="size-5" strokeWidth={1.75} />}
          title={t('empty')}
          description={t('emptyBody')}
          action={
            <Link
              href="/dashboard/new"
              className="pressable focus-ring bg-accent text-accent-fg inline-flex min-h-12 items-center rounded-md px-4 text-[15px] font-medium"
            >
              {tHome('emptyAction')}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => {
            const name =
              locale === 'ar' ? p.business_name_ar || p.business_name_fr : p.business_name_fr;
            const expires = new Intl.DateTimeFormat(locale === 'ar' ? 'fr-MA' : 'fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).format(new Date(p.expires_at));
            return (
              <li key={p.id}>
                <div className="border-border bg-surface flex items-stretch overflow-hidden rounded-lg border">
                  <Link
                    href={`/dashboard/profiles/${p.id}`}
                    className="pressable focus-ring flex min-h-16 min-w-0 flex-1 items-center gap-3 px-3 py-2"
                  >
                    <Avatar name={name} src={p.logo_url} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{name}</p>
                      <p className="text-text-muted truncate text-[12px]">
                        {t('expires', { date: expires })} · {p.plan_code}
                      </p>
                    </div>
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </Link>
                  {p.phone ? (
                    <a
                      href={`tel:${p.phone}`}
                      className={cn(
                        'border-border text-text-secondary pressable focus-ring inline-flex w-12 shrink-0 items-center justify-center border-s',
                      )}
                      aria-label={t('call')}
                    >
                      <Phone className="size-4" strokeWidth={1.75} />
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-text-muted text-center text-[12px] tabular">
        {filtered.length}/{profiles.length}
      </p>
    </div>
  );
}
