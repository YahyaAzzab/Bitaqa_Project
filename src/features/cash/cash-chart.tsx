'use client';

import { motion } from 'framer-motion';
import { formatMad } from '@/lib/money';
import { duration, easeOutExpo } from '@/lib/motion';
import type { DailyTotal } from '@/lib/dashboard/cash';
import type { Locale } from '@/i18n/config';

type Props = {
  data: DailyTotal[];
  locale: Locale;
  label: string;
};

export function CashChart({ data, locale, label }: Props) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const width = 320;
  const height = 120;
  const padX = 4;
  const padY = 8;
  const gap = 2;
  const barW = (width - padX * 2 - gap * (data.length - 1)) / Math.max(data.length, 1);

  const summary = data
    .filter((d) => d.total > 0)
    .map((d) => `${d.date}: ${formatMad(d.total, locale)}`)
    .join(' · ');

  return (
    <figure className="border-border bg-surface rounded-lg border p-4">
      <figcaption className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
        {label}
      </figcaption>
      <p className="sr-only">{summary || label}</p>
      <motion.svg
        role="img"
        aria-hidden
        viewBox={`0 0 ${width} ${height}`}
        className="mt-3 h-28 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.slow, ease: easeOutExpo }}
      >
        {data.map((d, i) => {
          const h = (d.total / max) * (height - padY * 2);
          const x = padX + i * (barW + gap);
          const y = height - padY - h;
          return (
            <rect
              key={d.date}
              x={x}
              y={y}
              width={Math.max(barW, 1)}
              height={Math.max(h, d.total > 0 ? 2 : 0)}
              rx={1.5}
              className="fill-accent/80"
            />
          );
        })}
      </motion.svg>
    </figure>
  );
}
