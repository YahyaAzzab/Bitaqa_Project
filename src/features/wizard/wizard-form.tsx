'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Eye,
  Facebook,
  Globe,
  Instagram,
  Link2,
  Music2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Sheet } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { ProfileView } from '@/features/profile/profile-view';
import { clearWizardDraft, loadWizardDraft, saveWizardDraft } from '@/features/wizard/draft';
import { checkSlugAvailable, createProfile, uploadLogo } from '@/features/wizard/actions';
import { useRouter } from '@/i18n/navigation';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatMad } from '@/lib/money';
import {
  PLAN_PRICES,
  WIZARD_LINK_TYPES,
  wizardDefaults,
  wizardFormSchema,
  type WizardFormValues,
  type WizardLinkType,
  type WizardStep,
} from '@/lib/profile/schema';
import { suggestSlugAlternatives, transliterateToSlug } from '@/lib/profile/slug';
import { buildSocialUrl } from '@/lib/profile/urls';
import type { ProfilePreviewData } from '@/lib/profile/types';
import { cn } from '@/lib/utils';

const STEPS: WizardStep[] = ['business', 'contact', 'links', 'identity', 'plan'];

const LINK_ICONS: Record<WizardLinkType, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
  linkedin: Link2,
  website: Globe,
  custom: Link2,
};

async function compressLogoToWebp(file: File, maxBytes = 200_000): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  let target = Math.min(side, 960);
  let quality = 0.86;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = target;
    canvas.height = target;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, target, target);
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', quality),
    );
    if (blob && blob.size <= maxBytes) break;
    if (quality > 0.5) quality -= 0.12;
    else target = Math.round(target * 0.82);
  }

  bitmap.close();
  if (!blob) throw new Error('compress');
  return blob;
}

function toPreview(values: WizardFormValues): ProfilePreviewData {
  return {
    businessNameFr: values.businessNameFr || '—',
    businessNameAr: values.businessNameAr || undefined,
    taglineFr: values.taglineFr || undefined,
    taglineAr: values.taglineAr || undefined,
    addressFr: values.addressFr || undefined,
    logoUrl: values.logoUrl,
    accentColor: values.accentColor,
    theme: values.theme,
    phone: values.phone || undefined,
    email: values.email || undefined,
    links: values.links.map((l) => ({
      type: l.type,
      labelFr: l.labelFr,
      labelAr: l.labelAr,
      value: l.value,
    })),
  };
}

export function WizardForm() {
  const t = useTranslations('dashboard.wizard');
  const tProfile = useTranslations('profile');
  const locale = useLocale() as 'fr' | 'ar';
  const router = useRouter();
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingLinkType, setPendingLinkType] = useState<WizardLinkType>('instagram');
  const [linkInput, setLinkInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const slugTouched = useRef(false);
  const draftLoaded = useRef(false);

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues: wizardDefaults,
    mode: 'onChange',
  });

  const { control, register, setValue, getValues, trigger, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'links' });
  const watched = useWatch({ control });

  useEffect(() => {
    if (draftLoaded.current) return;
    draftLoaded.current = true;
    void loadWizardDraft().then((draft) => {
      if (!draft) return;
      form.reset(draft.values);
      setStep(draft.step);
      toast({ title: t('draftRestored'), variant: 'success' });
    });
  }, [form, t, toast]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void saveWizardDraft(getValues(), step);
    }, 400);
    return () => window.clearTimeout(id);
  }, [watched, step, getValues]);

  const businessNameFr = useWatch({ control, name: 'businessNameFr' });
  const slug = useWatch({ control, name: 'slug' });
  const planCode = useWatch({ control, name: 'planCode' });
  const whatsappSame = useWatch({ control, name: 'whatsappSame' });

  useEffect(() => {
    if (slugTouched.current) return;
    const next = transliterateToSlug(businessNameFr || '');
    if (next) setValue('slug', next, { shouldValidate: true });
  }, [businessNameFr, setValue]);

  useEffect(() => {
    setValue('amountMad', PLAN_PRICES[planCode], { shouldValidate: true });
  }, [planCode, setValue]);

  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    const handle = window.setTimeout(() => {
      void checkSlugAvailable(slug).then((res) => {
        if (!res.ok) {
          setSlugStatus('idle');
          return;
        }
        setSlugStatus(res.data.available ? 'ok' : 'taken');
      });
    }, 380);
    return () => window.clearTimeout(handle);
  }, [slug]);

  const progress = ((step + 1) / STEPS.length) * 100;

  const validateStep = useCallback(async () => {
    const fieldsByStep: Record<WizardStep, (keyof WizardFormValues)[]> = {
      business: ['businessNameFr', 'slug'],
      contact: ['phone', 'whatsappSame', 'whatsapp', 'email', 'addressFr', 'mapsUrl'],
      links: ['links'],
      identity: ['theme', 'accentColor'],
      plan: ['planCode', 'amountMad', 'cashConfirmed', 'designNotes'],
    };
    const current = STEPS[step];
    if (!current) return false;
    const ok = await trigger(fieldsByStep[current]);
    if (current === 'business' && slugStatus === 'taken') return false;
    return ok;
  }, [slugStatus, step, trigger]);

  const goNext = useCallback(async () => {
    const ok = await validateStep();
    if (!ok) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [validateStep]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const addLink = useCallback(() => {
    const url = buildSocialUrl(pendingLinkType, linkInput);
    if (!url) {
      toast({ title: tProfile('copyFailed'), variant: 'error' });
      return;
    }
    append({ type: pendingLinkType, value: url });
    setLinkInput('');
  }, [append, linkInput, pendingLinkType, tProfile, toast]);

  const onLogoPick = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setUploading(true);
      try {
        const webp = await compressLogoToWebp(file);
        const fd = new FormData();
        fd.append('file', new File([webp], 'logo.webp', { type: 'image/webp' }));
        const res = await uploadLogo(fd);
        if (!res.ok) {
          toast({ title: t('logoHint'), variant: 'error' });
          return;
        }
        setValue('logoUrl', res.data.url, { shouldDirty: true });

        const canvas = document.createElement('canvas');
        const bmp = await createImageBitmap(webp);
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bmp, 0, 0, 1, 1);
          const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
          const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
          setValue('accentColor', hex);
        }
        bmp.close();
      } catch {
        toast({ title: t('logoHint'), variant: 'error' });
      } finally {
        setUploading(false);
      }
    },
    [setValue, t, toast],
  );

  const onSubmit = form.handleSubmit((values) => {
    if (!navigator.onLine) {
      toast({ title: t('offline'), variant: 'error' });
      return;
    }
    startSubmit(async () => {
      const res = await createProfile(values);
      if (!res.ok) {
        toast({
          title: res.error === 'slug_taken' ? t('slugTaken') : t('creating'),
          variant: 'error',
        });
        return;
      }
      await clearWizardDraft();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([10, 40, 10]);
      }
      router.push(`/dashboard/ready/${res.data.slug}`);
    });
  });

  const previewData = useMemo(
    () => toPreview({ ...wizardDefaults, ...watched } as WizardFormValues),
    [watched],
  );
  const siteUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://bitaqa.ma';
  const previewUrl = `${siteUrl}/${locale}/${watched.slug || 'apercu'}`;

  const dirOffset = locale === 'ar' ? -24 : 24;

  return (
    <div className="mx-auto w-full max-w-lg pb-28">
      <div className="mb-5">
        <p className="text-text-muted text-[12px] font-medium tracking-wide uppercase">
          {t('step', { current: step + 1, total: STEPS.length })}
        </p>
        <div className="bg-surface mt-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-accent h-full rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-text mt-3 text-[18px] font-semibold tracking-tight">
          {t(`steps.${STEPS[step]}`)}
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={STEPS[step]}
          initial={reduced ? false : { opacity: 0, x: dirOffset }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? undefined : { opacity: 0, x: -dirOffset }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          {STEPS[step] === 'business' ? (
            <>
              <Input
                label={t('nameFr')}
                className="text-[16px]"
                autoFocus
                enterKeyHint="next"
                {...register('businessNameFr')}
                error={formState.errors.businessNameFr?.message}
              />
              <Input
                label={t('nameAr')}
                className="text-[16px]"
                dir="rtl"
                {...register('businessNameAr')}
              />
              <Input
                label={t('tagline')}
                className="text-[16px]"
                {...register('taglineFr')}
              />
              <Input
                label={t('slug')}
                className="text-[16px]"
                dir="ltr"
                {...register('slug', {
                  onChange: () => {
                    slugTouched.current = true;
                  },
                })}
                hint={
                  slugStatus === 'ok'
                    ? t('slugAvailable')
                    : slugStatus === 'taken'
                      ? t('slugTaken')
                      : t('slugInvalid')
                }
                error={
                  slugStatus === 'taken'
                    ? t('slugTaken')
                    : formState.errors.slug
                      ? t('slugInvalid')
                      : undefined
                }
                trailing={
                  slugStatus === 'ok' ? (
                    <Check className="text-success me-2 size-4" strokeWidth={2} />
                  ) : null
                }
              />
              {slugStatus === 'taken' ? (
                <div className="flex flex-wrap gap-2">
                  {suggestSlugAlternatives(slug).map((alt) => (
                    <Chip
                      key={alt}
                      onSelect={() => {
                        slugTouched.current = true;
                        setValue('slug', alt, { shouldValidate: true });
                      }}
                    >
                      {alt}
                    </Chip>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          {STEPS[step] === 'contact' ? (
            <>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <PhoneInput
                    label={t('phone')}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={formState.errors.phone ? t('phone') : undefined}
                    className="text-[16px]"
                  />
                )}
              />
              <Controller
                control={control}
                name="whatsappSame"
                render={({ field }) => (
                  <Switch
                    id="wa-same"
                    label={t('whatsappSame')}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              {!whatsappSame ? (
                <Controller
                  control={control}
                  name="whatsapp"
                  render={({ field }) => (
                    <PhoneInput
                      label="WhatsApp"
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      className="text-[16px]"
                    />
                  )}
                />
              ) : null}
              <Input
                label={t('email')}
                type="email"
                inputMode="email"
                className="text-[16px]"
                dir="ltr"
                {...register('email')}
              />
              <Input
                label={t('address')}
                className="text-[16px]"
                {...register('addressFr')}
              />
              <Input
                label={t('maps')}
                className="text-[16px]"
                dir="ltr"
                inputMode="url"
                {...register('mapsUrl')}
              />
            </>
          ) : null}

          {STEPS[step] === 'links' ? (
            <>
              <div className="flex flex-wrap gap-2">
                {WIZARD_LINK_TYPES.map((type) => (
                  <Chip
                    key={type}
                    selected={pendingLinkType === type}
                    onSelect={() => setPendingLinkType(type)}
                  >
                    {type}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  label={t('addLink')}
                  className="text-[16px]"
                  dir="ltr"
                  placeholder="@pseudo ou URL"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  enterKeyHint="done"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLink();
                    }
                  }}
                />
              </div>
              <Button type="button" variant="secondary" className="w-full" onClick={addLink}>
                {t('addLink')}
              </Button>
              <ul className="space-y-2">
                {fields.map((field, index) => {
                  const Icon = LINK_ICONS[field.type as WizardLinkType] ?? Link2;
                  return (
                    <li
                      key={field.id}
                      className="border-border bg-surface flex min-h-12 items-center gap-3 rounded-md border px-3"
                    >
                      <Icon className="text-accent size-4 shrink-0" strokeWidth={1.75} />
                      <span className="min-w-0 flex-1 truncate text-[14px]" dir="ltr">
                        {field.value}
                      </span>
                      <button
                        type="button"
                        className="text-text-muted pressable focus-ring text-[13px]"
                        onClick={() => remove(index)}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {STEPS[step] === 'identity' ? (
            <>
              <div>
                <p className="text-text-secondary mb-1.5 text-[13px] font-medium">{t('logo')}</p>
                <p className="text-text-muted mb-2 text-[12px]">{t('logoHint')}</p>
                <label className="border-border bg-surface pressable focus-ring flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => void onLogoPick(e.target.files?.[0])}
                  />
                  <span className="text-[14px] font-medium">
                    {uploading ? '…' : watched.logoUrl ? '✓' : t('logo')}
                  </span>
                </label>
              </div>
              <div>
                <p className="text-text-secondary mb-2 text-[13px] font-medium">{t('theme')}</p>
                <Controller
                  control={control}
                  name="theme"
                  render={({ field }) => (
                    <SegmentedControl
                      ariaLabel={t('theme')}
                      value={field.value}
                      onChange={field.onChange}
                      segments={[
                        { value: 'noir', label: 'Noir' },
                        { value: 'ivoire', label: 'Ivoire' },
                      ]}
                    />
                  )}
                />
              </div>
              <Input
                label={t('accent')}
                type="color"
                className="h-12 cursor-pointer p-1 text-[16px]"
                {...register('accentColor')}
              />
            </>
          ) : null}

          {STEPS[step] === 'plan' ? (
            <>
              <Controller
                control={control}
                name="planCode"
                render={({ field }) => (
                  <SegmentedControl
                    ariaLabel={t('steps.plan')}
                    value={field.value}
                    onChange={field.onChange}
                    segments={[
                      {
                        value: 'essentiel',
                        label: `${t('planEssentiel')} · ${formatMad(PLAN_PRICES.essentiel, locale)}`,
                      },
                      {
                        value: 'signature',
                        label: `${t('planSignature')} · ${formatMad(PLAN_PRICES.signature, locale)}`,
                      },
                    ]}
                  />
                )}
              />
              <Input
                label={t('amount')}
                type="number"
                inputMode="numeric"
                className="text-[16px]"
                {...register('amountMad', { valueAsNumber: true })}
              />
              <Controller
                control={control}
                name="cashConfirmed"
                render={({ field }) => (
                  <Switch
                    id="cash"
                    label={t('cashConfirm')}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              {planCode === 'signature' ? (
                <Textarea
                  label={t('designNotes')}
                  className="text-[16px]"
                  {...register('designNotes')}
                />
              ) : null}
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div
        className={cn(
          'border-border bg-bg/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md',
          'px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mt-8 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none',
        )}
      >
        <div className="mx-auto flex max-w-lg gap-2">
          {step > 0 ? (
            <Button type="button" variant="secondary" className="min-w-20" onClick={goBack}>
              ←
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="min-w-12"
            onClick={() => setPreviewOpen(true)}
            aria-label={t('preview')}
          >
            <Eye className="size-5" strokeWidth={1.75} />
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" className="flex-1" onClick={() => void goNext()}>
              →
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1"
              loading={submitting}
              onClick={() => void onSubmit()}
            >
              {submitting ? t('creating') : t('submit')}
            </Button>
          )}
        </div>
      </div>

      <Sheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={t('preview')}
        closeLabel={tProfile('close')}
      >
        <div className="-mx-2 max-h-[65dvh] overflow-y-auto">
          <ProfileView data={previewData} profileUrl={previewUrl} locale={locale} preview />
        </div>
      </Sheet>
    </div>
  );
}
