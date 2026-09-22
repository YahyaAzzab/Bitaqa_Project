'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import {
  BookmarkPlus,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { Avatar } from '@/components/ui/avatar';
import { useTheme } from '@/components/providers';
import { fadeUp, staggerContainer, variantsFor } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { ProfilePreviewData } from '@/lib/profile/types';
import { resolveProfileTheme } from '@/lib/profile/theme';
import { toTelHref, toWhatsAppHref, isSafeProfileUrl } from '@/lib/profile/urls';
import { ProfileHours } from './profile-hours';
import { ProfileLinkRow } from './profile-link-row';
import { ProfileShareControls } from './profile-share';
import { ScanBeacon } from './scan-beacon';

type Props = {
  data: ProfilePreviewData & { slug?: string; defaultLang?: 'fr' | 'ar' };
  profileUrl: string;
  locale: 'fr' | 'ar';
  /** Mode aperçu dashboard — pas de scan, pas de pied de page CTA. */
  preview?: boolean;
};

function pick(
  locale: 'fr' | 'ar',
  fr: string | null | undefined,
  ar: string | null | undefined,
): string {
  if (locale === 'ar') return (ar || fr || '').trim();
  return (fr || ar || '').trim();
}

export function ProfileView({ data, profileUrl, locale, preview = false }: Props) {
  const t = useTranslations('profile');
  const currentLocale = useLocale() as 'fr' | 'ar';
  const reduced = useReducedMotion();
  const { setTheme, setAccent } = useTheme();

  const name = pick(locale, data.businessNameFr, data.businessNameAr);
  const tagline = pick(locale, data.taglineFr, data.taglineAr);
  const address = pick(locale, data.addressFr, data.addressAr);
  const expired = Boolean(data.expired);
  const theme = data.theme ?? resolveProfileTheme('noir');

  useEffect(() => {
    setTheme(theme);
    setAccent(data.accentColor || null);
    return () => {
      setAccent(null);
    };
  }, [theme, data.accentColor, setTheme, setAccent]);

  const whatsappLink =
    data.links.find((l) => l.type === 'whatsapp')?.value ||
    (data.phone ? toWhatsAppHref(data.phone) : null);

  const displayLinks = data.links.filter(
    (l) => !['phone', 'whatsapp'].includes(l.type) || l.type === 'custom',
  );

  const otherLocale = locale === 'fr' ? 'ar' : 'fr';

  return (
    <LazyMotion features={domAnimation}>
      {!preview && data.slug ? <ScanBeacon slug={data.slug} /> : null}
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between gap-2">
          <ProfileShareControls url={profileUrl} title={name} />
          {!preview && data.slug ? (
            <a
              href={`/${otherLocale}/${data.slug}`}
              className="pressable focus-ring text-text-secondary hover:text-text rounded-md px-3 py-2 text-[13px] font-medium"
              hrefLang={otherLocale}
            >
              {otherLocale === 'ar' ? 'العربية' : 'Français'}
            </a>
          ) : null}
        </header>

        <m.div
          className="mt-8 flex flex-col items-center text-center"
          variants={variantsFor(reduced, staggerContainer)}
          initial="hidden"
          animate="show"
        >
          <m.div variants={variantsFor(reduced, fadeUp)}>
            <Avatar name={name || 'B'} src={data.logoUrl} size={88} className="rounded-xl" />
          </m.div>
          <m.h1
            variants={variantsFor(reduced, fadeUp)}
            className="mt-5 text-[28px] leading-tight font-semibold tracking-tight"
          >
            {name}
          </m.h1>
          {tagline && !expired ? (
            <m.p
              variants={variantsFor(reduced, fadeUp)}
              className="text-text-secondary mt-2 max-w-[20rem] text-[15px] leading-relaxed"
            >
              {tagline}
            </m.p>
          ) : null}
          {address && !expired ? (
            <m.p
              variants={variantsFor(reduced, fadeUp)}
              className="text-text-muted mt-2 text-[13px]"
            >
              {address}
            </m.p>
          ) : null}
          {expired ? (
            <m.p
              variants={variantsFor(reduced, fadeUp)}
              className="text-text-muted mt-4 max-w-[18rem] text-[14px] leading-relaxed"
            >
              {t('expiredMessage')}
            </m.p>
          ) : null}
        </m.div>

        {(data.phone || whatsappLink) && (
          <div className="mt-8 grid gap-2">
            {data.phone ? (
              <a
                href={toTelHref(data.phone)}
                className="pressable focus-ring bg-accent text-accent-fg flex min-h-12 items-center justify-center gap-2 rounded-md text-[15px] font-medium"
              >
                <Phone className="size-5" strokeWidth={1.75} aria-hidden />
                {t('call')}
              </a>
            ) : null}
            {!expired && whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable focus-ring border-border bg-surface flex min-h-12 items-center justify-center gap-2 rounded-md border text-[15px] font-medium"
              >
                <MessageCircle className="size-5" strokeWidth={1.75} aria-hidden />
                {t('whatsapp')}
              </a>
            ) : null}
            {!expired && data.slug ? (
              <a
                href={`/api/vcard/${data.slug}`}
                className="pressable focus-ring border-border bg-surface text-text-secondary flex min-h-12 items-center justify-center gap-2 rounded-md border text-[15px] font-medium"
              >
                <BookmarkPlus className="size-5" strokeWidth={1.75} aria-hidden />
                {t('saveContact')}
              </a>
            ) : null}
          </div>
        )}

        {!expired && displayLinks.length > 0 ? (
          <section className="mt-8 space-y-2" aria-label={t('links')}>
            {displayLinks.map((link, index) => {
              if (link.type !== 'email' && link.type !== 'phone' && !isSafeProfileUrl(link.value)) {
                return null;
              }
              const label =
                pick(
                  locale,
                  link.labelFr ?? null,
                  link.labelAr ?? null,
                ) || t(`linkType.${link.type}`);
              return (
                <ProfileLinkRow
                  key={`${link.type}-${link.value}-${index}`}
                  type={link.type}
                  href={link.value}
                  label={label}
                  index={index}
                />
              );
            })}
          </section>
        ) : null}

        {!expired && data.hours ? <ProfileHours hours={data.hours} locale={locale} /> : null}

        {!preview ? (
          <footer className="border-border mt-auto border-t pt-8 pb-4">
            <p className="text-text-muted text-center text-[12px] tracking-[0.14em] uppercase">
              Bitaqa
            </p>
            <p className="text-text-secondary mt-2 text-center text-[14px] leading-relaxed">
              {t('ctaOrder')}
            </p>
            <Link
              href="/"
              locale={currentLocale}
              className="pressable focus-ring text-accent mt-3 flex min-h-11 items-center justify-center text-[14px] font-medium"
            >
              {t('ctaLink')}
            </Link>
          </footer>
        ) : null}
      </div>
    </LazyMotion>
  );
}
