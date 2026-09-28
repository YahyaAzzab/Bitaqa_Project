import { CirclePause } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';

type Props = {
  locale: Locale;
  name: string;
  reason: string | null;
};

export async function SuspendedProfile({ locale, name, reason }: Props) {
  const t = await getTranslations({ locale, namespace: 'profile' });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),24px)]">
      <p className="text-accent text-center text-[13px] font-medium tracking-[0.14em] uppercase">
        Bitaqa
      </p>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="border-border bg-surface text-text-secondary flex size-16 items-center justify-center rounded-full border">
          <CirclePause className="size-7" strokeWidth={1.5} aria-hidden />
        </span>
        <p className="text-text-secondary mt-6 max-w-full truncate text-[15px] font-medium">
          <bdi>{name}</bdi>
        </p>
        <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight">
          {t('suspendedTitle')}
        </h1>
        <p className="text-text-secondary mt-3 max-w-xs text-[15px] leading-relaxed">
          {t('suspendedBody')}
        </p>
        {reason ? (
          <figure className="border-border bg-surface mt-6 w-full rounded-lg border px-4 py-3 text-start">
            <figcaption className="text-text-muted text-[12px] font-medium tracking-wide">
              {t('suspendedReason')}
            </figcaption>
            <p
              dir="auto"
              className="mt-1 text-[15px] leading-relaxed break-words whitespace-pre-line"
            >
              {reason}
            </p>
          </figure>
        ) : null}
      </div>

      <div className="border-border border-t pt-5 text-center">
        <p className="text-text-muted text-[13px]">{t('ctaOrder')}</p>
        <Link
          href="/"
          locale={locale}
          className="pressable focus-ring text-accent mt-1 inline-flex min-h-12 items-center px-2 text-[15px] font-medium"
        >
          {t('ctaLink')}
        </Link>
      </div>
    </main>
  );
}
