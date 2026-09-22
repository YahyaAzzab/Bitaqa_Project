'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { WeeklyHours, DayKey } from '@/lib/profile/hours';
import { dayKeyFromIndex, isOpenNow, moroccoNowParts } from '@/lib/profile/hours';
import { cn } from '@/lib/utils';

const ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

type Props = {
  hours: WeeklyHours;
  locale: 'fr' | 'ar';
};

export function ProfileHours({ hours, locale }: Props) {
  const t = useTranslations('profile');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isOpenNow(hours));
    const id = window.setInterval(() => setOpen(isOpenNow(hours)), 60_000);
    return () => window.clearInterval(id);
  }, [hours]);

  const today = useMemo(() => dayKeyFromIndex(moroccoNowParts().dayIndex), []);

  const dayLabel = (key: DayKey) => t(`day.${key}`);

  return (
    <section className="mt-8" aria-labelledby="hours-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="hours-heading" className="text-[13px] font-medium tracking-[0.12em] uppercase text-text-muted">
          {t('hours')}
        </h2>
        <span
          className={cn(
            'rounded-sm px-2 py-0.5 text-[12px] font-medium',
            open ? 'bg-success/15 text-success' : 'bg-surface-raised text-text-muted',
          )}
        >
          {open ? t('openNow') : t('closedNow')}
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {ORDER.map((key) => {
          const slots = hours[key] ?? [];
          const isToday = key === today;
          return (
            <li
              key={key}
              className={cn(
                'flex items-baseline justify-between gap-3 text-[14px]',
                isToday ? 'text-text font-medium' : 'text-text-secondary',
              )}
            >
              <span>{dayLabel(key)}</span>
              <span className="tabular text-end" dir="ltr">
                {slots.length === 0
                  ? t('closed')
                  : slots.map(([a, b]) => `${a} – ${b}`).join(locale === 'ar' ? ' · ' : ', ')}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
