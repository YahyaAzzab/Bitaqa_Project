'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  KeyRound,
  Settings2,
  Share2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { AccountSettings } from '@/features/account/account-settings';
import { saveOwnProfile } from '@/features/account/actions';
import { DesignPanel } from '@/features/account/design-panel';
import { LinksPanel } from '@/features/account/links-panel';
import type { OwnerProfileMeta, OwnerScanStats } from '@/features/account/load-profile';
import { PasswordForm } from '@/features/account/password-form';
import { ProfilePanel } from '@/features/account/profile-panel';
import { StatsPanel } from '@/features/account/stats-panel';
import { ProfileView } from '@/features/profile/profile-view';
import { useKeyboardOffset } from '@/hooks/use-keyboard-offset';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { OwnedProfileSummary } from '@/lib/auth/account-session';
import { TEAM_PHONES } from '@/lib/contact';
import { normalizeMoroccanPhone } from '@/lib/phone';
import { ownerProfileSchema, type OwnerLink, type OwnerProfileValues } from '@/lib/profile/schema';
import type { ProfilePreviewData } from '@/lib/profile/types';
import { toWhatsAppHref } from '@/lib/profile/urls';
import { cn } from '@/lib/utils';

type TabId = 'links' | 'profile' | 'design' | 'stats';
const TABS: TabId[] = ['links', 'profile', 'design', 'stats'];

const PROFILE_FIELDS = new Set([
  'businessNameFr',
  'businessNameAr',
  'taglineFr',
  'taglineAr',
  'phone',
  'whatsapp',
  'email',
  'addressFr',
  'mapsUrl',
  'hours',
]);

const KNOWN_ERRORS = new Set([
  'phone_invalid',
  'whatsapp_invalid',
  'email_invalid',
  'url_unsafe',
  'hours_invalid',
]);

type Props = {
  initial: OwnerProfileValues;
  meta: OwnerProfileMeta;
  stats: OwnerScanStats;
  publicUrl: string;
  email: string;
  passwordSet: boolean;
  profiles: OwnedProfileSummary[];
};

function toPreview(values: OwnerProfileValues): ProfilePreviewData {
  const phone = normalizeMoroccanPhone(values.phone) ?? undefined;
  const waRaw = values.whatsappSame ? values.phone : values.whatsapp;
  const wa = waRaw ? normalizeMoroccanPhone(waRaw) : null;
  const system: ProfilePreviewData['links'] = [];
  if (wa) system.push({ type: 'whatsapp', value: toWhatsAppHref(wa) });
  if (values.email?.trim()) system.push({ type: 'email', value: values.email.trim() });
  if (values.mapsUrl?.trim()) system.push({ type: 'maps', value: values.mapsUrl.trim() });

  return {
    businessNameFr: values.businessNameFr || '—',
    businessNameAr: values.businessNameAr || undefined,
    taglineFr: values.taglineFr || undefined,
    taglineAr: values.taglineAr || undefined,
    addressFr: values.addressFr || undefined,
    logoUrl: values.logoUrl,
    accentColor: values.accentColor,
    theme: values.theme,
    phone,
    email: values.email || undefined,
    hours: values.hoursEnabled ? values.hours : null,
    links: [
      ...system,
      ...values.links.map((l) => ({
        type: l.type,
        labelFr: l.labelFr || undefined,
        labelAr: l.labelAr || undefined,
        value: l.value,
      })),
    ],
  };
}

function firstErrorTab(errors: FieldErrors<OwnerProfileValues>): TabId {
  if (errors.links) return 'links';
  if (Object.keys(errors).some((key) => PROFILE_FIELDS.has(key))) return 'profile';
  return 'design';
}

function linkErrorKeys(errors: FieldErrors<OwnerProfileValues>, links: OwnerLink[]): Set<string> {
  const keys = new Set<string>();
  const list = errors.links;
  if (!Array.isArray(list)) return keys;
  list.forEach((entry, index) => {
    const key = links[index]?.key;
    if (entry && key) keys.add(key);
  });
  return keys;
}

export function AccountEditor({
  initial,
  meta,
  stats,
  publicUrl,
  email,
  passwordSet,
  profiles,
}: Props) {
  const t = useTranslations('account');
  const locale = useLocale() as 'fr' | 'ar';
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const keyboardOffset = useKeyboardOffset();
  const [tab, setTab] = useState<TabId>('links');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoAccent, setLogoAccent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, startSaving] = useTransition();

  const form = useForm<OwnerProfileValues>({
    resolver: zodResolver(ownerProfileSchema),
    defaultValues: initial,
    mode: 'onChange',
  });
  const { control, formState, handleSubmit, reset, setValue } = form;
  const watched = useWatch({ control }) as OwnerProfileValues;
  const links = useWatch({ control, name: 'links' });
  const dirty = formState.isDirty;
  const disabled = !meta.editable;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const preview = useMemo(() => toPreview({ ...initial, ...watched }), [initial, watched]);
  const errorKeys = useMemo(
    () => linkErrorKeys(formState.errors, links),
    [formState.errors, links],
  );

  const fieldError = useCallback(
    (message: string | undefined) => {
      if (!message) return undefined;
      return KNOWN_ERRORS.has(message)
        ? t(`errors.${message}` as 'errors.field')
        : t('errors.field');
    },
    [t],
  );

  const onSave = handleSubmit(
    (values) => {
      if (!navigator.onLine) {
        toast({ title: t('errors.offline'), variant: 'error' });
        return;
      }
      startSaving(async () => {
        const res = await saveOwnProfile(values);
        if (!res.ok) {
          const known = ['forbidden', 'profile_inactive', 'rate_limited', 'phone_invalid'];
          toast({
            title: t(`errors.${known.includes(res.error) ? res.error : 'save'}` as 'errors.save'),
            variant: 'error',
          });
          return;
        }
        reset(values);
        if ('vibrate' in navigator) navigator.vibrate(8);
        toast({ title: t('saved'), description: t('savedHint'), variant: 'success' });
      });
    },
    (errors) => {
      setTab(firstErrorTab(errors));
      toast({ title: t('errors.check'), variant: 'error' });
    },
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: t('copyFailed'), variant: 'error' });
    }
  };

  const share = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url: publicUrl, title: watched.businessNameFr });
        return;
      } catch {
        return;
      }
    }
    await copy();
  };

  const name =
    locale === 'ar' ? watched.businessNameAr || watched.businessNameFr : watched.businessNameFr;
  const { host: urlHost, pathname: urlPath } = new URL(publicUrl);
  const expires = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA-u-nu-latn' : 'fr-FR', {
    dateStyle: 'long',
  }).format(new Date(meta.expiresAt));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-[max(1rem,env(safe-area-inset-top))] lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:px-8">
      <div className="min-w-0 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <header className="flex items-center gap-3">
          <Avatar name={name || 'B'} src={watched.logoUrl} size={44} className="rounded-md" />
          <div className="min-w-0 flex-1">
            <p className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
              {t('eyebrow')}
            </p>
            <h1 className="truncate text-[18px] leading-tight font-semibold tracking-tight">
              {name}
            </h1>
          </div>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('open')}
            className="pressable focus-ring text-text-secondary hover:bg-surface inline-flex size-12 items-center justify-center rounded-md"
          >
            <ExternalLink className="size-5" strokeWidth={1.75} aria-hidden />
          </a>
          <IconButton
            label={t('settings.title')}
            onClick={() => setSettingsOpen(true)}
            className="-me-2"
          >
            <Settings2 className="size-5" strokeWidth={1.75} />
          </IconButton>
        </header>

        <section className="border-border bg-surface mt-5 rounded-lg border p-3">
          <div className="flex items-center gap-2 px-1">
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                meta.editable ? 'bg-success' : 'bg-warning',
              )}
              aria-hidden
            />
            <p className="text-text-secondary text-[13px]">
              {meta.editable ? t('live') : t('paused')}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p
              dir="ltr"
              className="border-border bg-bg flex min-w-0 flex-1 rounded-md border px-3 py-3 text-[14px]"
            >
              <span className="text-text-muted truncate">{urlHost}</span>
              <span className="text-text shrink-0 font-medium">{urlPath}</span>
            </p>
            <IconButton
              label={copied ? t('copied') : t('copy')}
              onClick={() => void copy()}
              className="border-border bg-bg border"
            >
              {copied ? (
                <Check className="text-success size-5" strokeWidth={2} />
              ) : (
                <Copy className="size-5" strokeWidth={1.75} />
              )}
            </IconButton>
            <IconButton
              label={t('share')}
              onClick={() => void share()}
              className="border-border bg-bg border"
            >
              <Share2 className="size-5" strokeWidth={1.75} />
            </IconButton>
          </div>
          <span className="sr-only" aria-live="polite">
            {copied ? t('copied') : ''}
          </span>
        </section>

        {!meta.editable ? (
          <section
            role="status"
            className="border-warning/40 bg-warning/10 mt-4 rounded-lg border p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="text-warning mt-0.5 size-5 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">
                  {meta.status === 'suspended' ? t('suspendedTitle') : t('expiredTitle')}
                </p>
                <p className="text-text-secondary mt-1 text-[13px] leading-relaxed">
                  {meta.status === 'suspended'
                    ? t('suspendedBody')
                    : t('expiredBody', { date: expires })}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TEAM_PHONES.map((phone) => (
                    <a
                      key={phone.href}
                      href={phone.href}
                      dir="ltr"
                      className="pressable focus-ring border-border bg-surface tabular inline-flex min-h-12 items-center rounded-md border px-4 text-[14px] font-medium"
                    >
                      {phone.display}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!passwordSet ? (
          <section className="border-accent/40 bg-accent/5 mt-4 rounded-lg border p-4">
            <div className="mb-4 flex items-start gap-3">
              <KeyRound
                className="text-accent mt-0.5 size-5 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <div>
                <p className="text-[15px] font-semibold">{t('password.promptTitle')}</p>
                <p className="text-text-secondary mt-1 text-[13px] leading-relaxed">
                  {t('password.promptBody')}
                </p>
              </div>
            </div>
            <PasswordForm email={email} submitLabel={t('password.create')} />
          </section>
        ) : null}

        <nav
          role="tablist"
          aria-label={t('tabsLabel')}
          className="bg-bg/95 border-border sticky top-0 z-20 -mx-4 mt-6 flex border-b px-4 backdrop-blur-md"
        >
          {TABS.map((id) => {
            const selected = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`account-tab-${id}`}
                aria-selected={selected}
                aria-controls={`account-panel-${id}`}
                onClick={() => setTab(id)}
                className={cn(
                  'focus-ring relative min-h-12 flex-1 text-[14px] font-medium transition-colors duration-150',
                  selected ? 'text-text' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                {t(`tabs.${id}`)}
                {selected ? (
                  <motion.span
                    layoutId={reduced ? undefined : 'account-tab-indicator'}
                    className="bg-accent absolute inset-x-3 bottom-0 h-0.5 rounded-full"
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : null}
              </button>
            );
          })}
        </nav>

        <fieldset disabled={disabled && tab !== 'stats'} className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              role="tabpanel"
              id={`account-panel-${tab}`}
              aria-labelledby={`account-tab-${tab}`}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn('pt-6', disabled && tab !== 'stats' && 'opacity-60')}
            >
              {tab === 'links' ? (
                <LinksPanel
                  links={links}
                  disabled={disabled}
                  errorKeys={errorKeys}
                  onChange={(next) =>
                    setValue('links', next, { shouldDirty: true, shouldValidate: true })
                  }
                />
              ) : null}
              {tab === 'profile' ? (
                <ProfilePanel form={form} fieldError={fieldError} onLogoAccent={setLogoAccent} />
              ) : null}
              {tab === 'design' ? (
                <DesignPanel
                  form={form}
                  logoAccent={logoAccent}
                  savedAccent={initial.accentColor}
                />
              ) : null}
              {tab === 'stats' ? <StatsPanel stats={stats} /> : null}
            </motion.div>
          </AnimatePresence>
        </fieldset>
      </div>

      <aside className="hidden lg:block" aria-label={t('preview')}>
        <div className="sticky top-6 pt-2">
          <p className="text-text-muted mb-3 text-center text-[12px] font-medium tracking-[0.14em] uppercase">
            {t('preview')}
          </p>
          <div className="border-border bg-surface mx-auto w-[360px] rounded-[40px] border p-2.5">
            <div
              data-theme={preview.theme}
              className="bg-bg h-[min(720px,calc(100dvh-8rem))] overflow-y-auto rounded-[32px]"
            >
              <ProfileView
                data={{ ...preview, slug: meta.slug }}
                profileUrl={publicUrl}
                locale={locale}
                preview
              />
            </div>
          </div>
        </div>
      </aside>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={keyboardOffset > 0 ? { transform: `translateY(-${keyboardOffset}px)` } : undefined}
      >
        <AnimatePresence initial={false} mode="wait">
          {dirty ? (
            <motion.div
              key="save"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="border-border bg-surface-raised pointer-events-auto mx-auto flex max-w-lg items-center gap-2 rounded-lg border p-2 shadow-[var(--shadow-sheet)]"
              role="region"
              aria-label={t('unsaved')}
            >
              <p className="text-text-secondary min-w-0 flex-1 truncate ps-2 text-[13px]">
                {t('unsaved')}
              </p>
              <IconButton
                label={t('preview')}
                className="lg:hidden"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="size-5" strokeWidth={1.75} />
              </IconButton>
              <Button variant="ghost" onClick={() => reset()} disabled={saving}>
                {t('discard')}
              </Button>
              <Button onClick={() => void onSave()} loading={saving}>
                {t('save')}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="flex justify-center lg:hidden"
            >
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="pressable focus-ring border-border bg-surface-raised text-text pointer-events-auto inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-[14px] font-medium shadow-[var(--shadow-sheet)]"
              >
                <Eye className="size-[18px]" strokeWidth={1.75} aria-hidden />
                {t('preview')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Sheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={t('preview')}
        closeLabel={t('settings.close')}
      >
        <div data-theme={preview.theme} className="bg-bg -mx-4 -my-4 max-h-[70dvh] overflow-y-auto">
          <ProfileView
            data={{ ...preview, slug: meta.slug }}
            profileUrl={publicUrl}
            locale={locale}
            preview
          />
        </div>
      </Sheet>

      <AccountSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        email={email}
        passwordSet={passwordSet}
        profiles={profiles}
        currentProfileId={meta.id}
      />
    </div>
  );
}
