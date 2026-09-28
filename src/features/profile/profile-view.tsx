'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import { ArrowRight, BookmarkPlus, MapPin, MessageCircle, Nfc, Phone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, type ComponentType } from 'react';
import { Link } from '@/i18n/navigation';
import { useTheme } from '@/components/providers';
import { fadeScale, fadeUp, staggerContainer, transitionBase, variantsFor } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { ProfilePreviewData } from '@/lib/profile/types';
import { resolveProfileTheme } from '@/lib/profile/theme';
import { toTelHref, toWhatsAppHref, isSafeProfileUrl } from '@/lib/profile/urls';
import { accentStyle } from '@/lib/color';
import { cn } from '@/lib/utils';
import { ProfileHours } from './profile-hours';
import { ProfileLinkRow } from './profile-link-row';
import { ProfileLogo } from './profile-logo';
import { ProfileShareControls } from './profile-share';
import { ScanBeacon } from './scan-beacon';

type Props = {
  data: ProfilePreviewData & { slug?: string; defaultLang?: 'fr' | 'ar' };
  profileUrl: string;
  locale: 'fr' | 'ar';
  /** Mode aperçu dashboard — pas de scan, pas de pied de page CTA. */
  preview?: boolean;
};

type DockAction = {
  key: string;
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>;
  primary?: boolean;
  external?: boolean;
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

  // Sheets and toasts portal to <body>, so the live page mirrors its palette on <html>.
  // The dashboard preview must not repaint the seller's app.
  useEffect(() => {
    if (preview) return;
    setTheme(theme);
    setAccent(data.accentColor || null);
    return () => {
      setTheme('noir');
      setAccent(null);
    };
  }, [preview, theme, data.accentColor, setTheme, setAccent]);

  const whatsappLink =
    data.links.find((l) => l.type === 'whatsapp')?.value ||
    (data.phone ? toWhatsAppHref(data.phone) : null);

  const seen = new Set<string>();
  const links = expired
    ? []
    : data.links.filter((l) => {
        if (l.type === 'phone') return false;
        const value = l.type === 'whatsapp' ? toWhatsAppHref(l.value) : l.value;
        if (l.type !== 'email' && !isSafeProfileUrl(value)) return false;
        const key = `${l.type}:${value}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

  const actions: DockAction[] = [];
  if (data.phone) {
    actions.push({
      key: 'call',
      href: toTelHref(data.phone),
      label: t('call'),
      icon: Phone,
      primary: true,
    });
  }
  if (!expired && whatsappLink) {
    actions.push({
      key: 'wa',
      href: whatsappLink,
      label: t('whatsapp'),
      icon: MessageCircle,
      external: true,
    });
  }
  if (!expired && data.slug) {
    actions.push({
      key: 'vcard',
      href: `/api/vcard/${data.slug}`,
      label: t('saveShort'),
      icon: BookmarkPlus,
    });
  }

  const otherLocale = locale === 'fr' ? 'ar' : 'fr';
  const hasDock = actions.length > 0;

  return (
    <LazyMotion features={domAnimation}>
      {!preview && data.slug ? <ScanBeacon slug={data.slug} /> : null}
      <div
        data-theme={theme}
        style={accentStyle(data.accentColor)}
        className={cn('bg-bg text-text relative isolate', !preview && 'min-h-dvh')}
      >
        <div
          aria-hidden
          className="profile-halo pointer-events-none absolute inset-x-0 top-0 -z-10 h-80"
        />

        <div
          className={cn(
            'mx-auto flex w-full max-w-md flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))]',
            preview ? 'pb-0' : 'min-h-dvh',
            !preview &&
              (hasDock
                ? 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]'
                : 'pb-[max(1.5rem,env(safe-area-inset-bottom))]'),
          )}
        >
          <header className="flex items-center justify-between gap-2">
            <ProfileShareControls url={profileUrl} title={name} />
            {!preview && data.slug ? (
              <a
                href={`/${otherLocale}/${data.slug}`}
                hrefLang={otherLocale}
                lang={otherLocale}
                className="pressable focus-ring border-border bg-surface/70 text-text-secondary hover:text-text inline-flex min-h-12 items-center rounded-full border px-4 text-[13px] font-medium"
              >
                {otherLocale === 'ar' ? 'العربية' : 'Français'}
              </a>
            ) : null}
          </header>

          <m.div
            className="mt-10 flex flex-col items-center text-center"
            variants={variantsFor(reduced, staggerContainer)}
            initial="hidden"
            animate="show"
          >
            <m.div
              variants={variantsFor(reduced, fadeScale)}
              className="border-border bg-surface/60 rounded-[16px] border p-1"
            >
              <ProfileLogo
                name={name || 'B'}
                src={data.logoUrl}
                priority={!preview}
                zoomable={!preview}
                zoomLabel={t('zoomLogo')}
                closeLabel={t('close')}
              />
            </m.div>
            <m.h1
              variants={variantsFor(reduced, fadeUp)}
              className="mt-6 max-w-full text-[30px] leading-[1.1] font-semibold tracking-tight text-balance break-words"
            >
              {name}
            </m.h1>
            {tagline && !expired ? (
              <m.p
                variants={variantsFor(reduced, fadeUp)}
                className="text-text-secondary mt-3 max-w-[22rem] text-[15px] leading-relaxed text-pretty"
              >
                {tagline}
              </m.p>
            ) : null}
            {address && !expired ? (
              <m.p
                variants={variantsFor(reduced, fadeUp)}
                className="text-text-muted mt-3 inline-flex max-w-full items-center gap-1.5 text-[13px]"
              >
                <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="truncate">{address}</span>
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
            <m.span
              variants={variantsFor(reduced, fadeUp)}
              className="bg-accent/60 mt-8 h-px w-12"
              aria-hidden
            />
          </m.div>

          {links.length > 0 ? (
            <section className="mt-8" aria-labelledby="links-heading">
              <h2
                id="links-heading"
                className="text-text-muted text-[12px] font-medium tracking-[0.14em] uppercase"
              >
                {t('findUs')}
              </h2>
              <m.ul
                className="border-border bg-surface divide-border mt-3 divide-y overflow-hidden rounded-lg border"
                variants={variantsFor(reduced, staggerContainer)}
                initial="hidden"
                animate="show"
              >
                {links.map((link, index) => (
                  <m.li
                    key={`${link.type}-${link.value}-${index}`}
                    variants={variantsFor(reduced, fadeUp)}
                  >
                    <ProfileLinkRow
                      type={link.type}
                      href={link.value}
                      label={
                        pick(locale, link.labelFr ?? null, link.labelAr ?? null) ||
                        t(`linkType.${link.type}`)
                      }
                    />
                  </m.li>
                ))}
              </m.ul>
            </section>
          ) : null}

          {!expired && data.hours ? <ProfileHours hours={data.hours} locale={locale} /> : null}

          {!preview ? (
            <footer className="mt-auto pt-12">
              <Link
                href="/"
                locale={currentLocale}
                className="pressable focus-ring border-border bg-surface hover:bg-surface-raised/60 flex items-center gap-4 rounded-lg border p-4 transition-colors"
              >
                <span
                  aria-hidden
                  className="profile-mini-card flex h-11 w-[70px] shrink-0 items-end justify-between rounded-[6px] p-1.5"
                >
                  <span className="text-[7px] leading-none font-semibold tracking-[0.2em]">
                    BITAQA
                  </span>
                  <Nfc className="size-3.5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-text block text-[14px] leading-snug font-medium">
                    {t('ctaOrder')}
                  </span>
                  <span className="text-accent mt-0.5 block text-[13px] font-medium">
                    {t('ctaLink')}
                  </span>
                </span>
                <ArrowRight
                  className="text-text-muted size-[18px] shrink-0 rtl:-scale-x-100"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </Link>
            </footer>
          ) : null}

          {hasDock ? (
            <m.nav
              aria-label={t('contactActions')}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transitionBase, delay: reduced ? 0 : 0.18 }}
              className={cn(
                'border-border bg-bg/90 z-30 border-t backdrop-blur-md',
                preview ? 'sticky bottom-0 -mx-5 mt-8' : 'fixed inset-x-0 bottom-0',
              )}
              style={{
                paddingBottom: preview ? '0.75rem' : 'max(0.75rem, env(safe-area-inset-bottom))',
              }}
            >
              <div
                className="mx-auto grid max-w-md gap-2 px-5 pt-3"
                style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
              >
                {actions.map((action) => {
                  const Icon = action.icon;
                  const single = actions.length === 1;
                  return (
                    <a
                      key={action.key}
                      href={action.href}
                      target={action.external ? '_blank' : undefined}
                      rel={action.external ? 'noopener noreferrer' : undefined}
                      className={cn(
                        'pressable focus-ring flex min-h-14 items-center justify-center rounded-md font-medium',
                        single ? 'flex-row gap-2 text-[15px]' : 'flex-col gap-1 text-[12px]',
                        action.primary
                          ? 'bg-accent text-accent-fg'
                          : 'border-border bg-surface text-text border',
                      )}
                    >
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                      <span className="max-w-full truncate px-1">{action.label}</span>
                    </a>
                  );
                })}
              </div>
            </m.nav>
          ) : null}
        </div>
      </div>
    </LazyMotion>
  );
}
