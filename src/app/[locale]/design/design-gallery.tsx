'use client';

import { ArrowUpRight, Inbox, Settings, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { useTheme } from '@/components/providers';
import { Link } from '@/i18n/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

type AccentName = 'laiton' | 'olive' | 'clay';
type Range = 'day' | 'week' | 'month';

const ACCENTS: Record<AccentName, string> = {
  laiton: '#c9a96e',
  olive: '#8a9a6a',
  clay: '#c4845a',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="design-section flex flex-col gap-4">
      <h2 className="text-text-muted text-[13px] font-medium tracking-[0.08em] uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DesignGallery() {
  const t = useTranslations('design');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { toast } = useToast();
  const { theme, setTheme, setAccent } = useTheme();
  const switchId = useId();

  const [accentName, setAccentName] = useState<AccentName>('laiton');
  const [phone, setPhone] = useState('+212661234567');
  const [whatsapp, setWhatsapp] = useState(true);
  const [plan, setPlan] = useState('essentiel');
  const [chip, setChip] = useState('instagram');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [range, setRange] = useState<Range>('day');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAccent(ACCENTS[accentName]);
    return () => setAccent(null);
  }, [accentName, setAccent]);

  return (
    <main className="design-shell mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-6 pb-16">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="home-kicker">Bitaqa / 02</p>
            <h1 className="mt-2 text-[32px] leading-none font-semibold tracking-tight">
              {t('title')}
            </h1>
          </div>
          <Link
            href="/design"
            locale={locale === 'fr' ? 'ar' : 'fr'}
            className="focus-ring pressable border-border text-text-secondary inline-flex min-h-12 items-center rounded-md border px-3 text-sm"
          >
            {tc('language')}
          </Link>
        </div>
        <p className="text-text-secondary text-[15px] leading-relaxed">{t('lede')}</p>
      </header>

      <section className="design-hero overflow-hidden rounded-xl border border-white/10 p-5">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-accent text-[11px] font-semibold tracking-[0.18em] uppercase">
              {t('heroKicker')}
            </p>
            <p className="text-ivory mt-3 max-w-[15rem] text-2xl leading-tight font-semibold tracking-tight">
              {t('heroTitle')}
            </p>
          </div>
          <Sparkles className="text-accent mt-1 shrink-0" size={22} strokeWidth={1.5} />
        </div>
        <div className="design-preview-card relative z-10 mt-7">
          <div className="flex items-start justify-between">
            <span className="text-[10px] tracking-[0.2em] text-white/50 uppercase">BITAQA</span>
            <ArrowUpRight className="text-accent" size={18} strokeWidth={1.6} />
          </div>
          <div className="mt-8">
            <div className="bg-accent mb-3 h-px w-10" />
            <p className="text-ivory text-lg font-semibold">{t('heroCardName')}</p>
            <p className="mt-1 text-xs text-white/50">{t('heroCardRole')}</p>
          </div>
        </div>
      </section>

      <Section title={t('theme')}>
        <SegmentedControl
          ariaLabel={t('theme')}
          value={theme}
          onChange={setTheme}
          segments={[
            { value: 'noir', label: t('themeNoir') },
            { value: 'ivoire', label: t('themeIvoire') },
          ]}
        />
      </Section>

      <Section title={t('accent')}>
        <SegmentedControl
          ariaLabel={t('accent')}
          value={accentName}
          onChange={setAccentName}
          segments={[
            { value: 'laiton', label: t('accentDefault') },
            { value: 'olive', label: t('accentOlive') },
            { value: 'clay', label: t('accentClay') },
          ]}
        />
      </Section>

      <Section title={t('type')}>
        <div className="flex flex-col gap-3">
          <p className="text-[32px] leading-none font-semibold tracking-tight">
            {t('typeDisplay')}
          </p>
          <p className="text-[24px] leading-tight font-semibold">{t('typeTitle')}</p>
          <p className="text-[16px] leading-relaxed">{t('typeBody')}</p>
          <p className="text-text-muted text-[13px] tracking-wide">{t('typeCaption')}</p>
          <p className="tabular text-[20px] font-medium">{t('typeNumbers')}</p>
        </div>
      </Section>

      <Section title={t('actions')}>
        <div className="grid grid-cols-2 gap-2">
          <Button
            loading={loading}
            onClick={() => {
              setLoading(true);
              window.setTimeout(() => setLoading(false), 1200);
            }}
          >
            {loading ? t('loading') : t('primary')}
          </Button>
          <Button variant="secondary">{t('secondary')}</Button>
          <Button variant="ghost">{t('ghost')}</Button>
          <Button variant="danger">{t('danger')}</Button>
        </div>
        <IconButton label={t('iconLabel')}>
          <Settings size={20} strokeWidth={1.75} />
        </IconButton>
      </Section>

      <Section title={t('fields')}>
        <div className="flex flex-col gap-4">
          <Input
            name="business"
            label={t('nameLabel')}
            placeholder={t('namePlaceholder')}
            hint={t('nameHint')}
          />
          <Textarea name="bio" label={t('bioLabel')} placeholder={t('bioPlaceholder')} />
          <PhoneInput
            label={t('phoneLabel')}
            hint={t('phoneHint')}
            value={phone}
            onValueChange={setPhone}
          />
          <Select
            name="plan"
            label={t('planLabel')}
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            options={[
              { value: 'essentiel', label: t('planEssential') },
              { value: 'signature', label: t('planSignature') },
            ]}
          />
          <Switch
            id={switchId}
            checked={whatsapp}
            onCheckedChange={setWhatsapp}
            label={t('whatsappSame')}
            description={t('whatsappHint')}
          />
        </div>
      </Section>

      <Section title={t('chips')}>
        <div className="flex flex-wrap gap-2">
          <Chip selected={chip === 'instagram'} onSelect={() => setChip('instagram')}>
            {t('chipInstagram')}
          </Chip>
          <Chip selected={chip === 'site'} onSelect={() => setChip('site')}>
            {t('chipSite')}
          </Chip>
          <Chip onDismiss={() => undefined} dismissLabel={t('chipRemove')}>
            {t('chipOther')}
          </Chip>
        </div>
      </Section>

      <Section title={t('tabs')}>
        <Tabs
          items={[
            {
              id: 'states',
              label: t('tabStates'),
              panel: <p className="text-text-secondary text-[15px]">{t('tabStatesBody')}</p>,
            },
            {
              id: 'motion',
              label: t('tabMotion'),
              panel: <p className="text-text-secondary text-[15px]">{t('tabMotionBody')}</p>,
            },
          ]}
        />
      </Section>

      <Section title={t('overlay')}>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            {t('openSheet')}
          </Button>
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            {t('openDialog')}
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              toast({ title: t('toastTitle'), description: t('toastBody'), variant: 'success' })
            }
          >
            {t('showToast')}
          </Button>
        </div>
      </Section>

      <Section title={t('feedback')}>
        <Card>
          <p className="text-text-muted mb-3 text-[13px]">{t('skeleton')}</p>
          <div className="flex gap-3">
            <Skeleton className="size-12" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </Card>
        <Card padding="none">
          <EmptyState
            icon={<Inbox size={20} strokeWidth={1.75} />}
            title={t('emptyTitle')}
            description={t('emptyBody')}
            action={<Button size="sm">{t('emptyAction')}</Button>}
          />
        </Card>
      </Section>

      <Section title={t('badges')}>
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">{t('badgeActive')}</Badge>
          <Badge tone="accent">{t('badgeReady')}</Badge>
          <Badge tone="error">{t('badgeExpired')}</Badge>
          <Badge tone="warning">{t('badgeSoon')}</Badge>
        </div>
      </Section>

      <Section title={t('avatars')}>
        <div className="flex items-center gap-3">
          <Avatar name="Atelier Nour" />
          <Avatar name="نور" size={40} />
          <Avatar name="Maison" size={32} />
        </div>
      </Section>

      <Section title={t('segment')}>
        <SegmentedControl
          ariaLabel={t('segment')}
          value={range}
          onChange={setRange}
          segments={[
            { value: 'day', label: t('segDay') },
            { value: 'week', label: t('segWeek') },
            { value: 'month', label: t('segMonth') },
          ]}
        />
      </Section>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t('sheetTitle')}
        closeLabel={tc('close')}
        footer={
          <Button className="w-full" onClick={() => setSheetOpen(false)}>
            {tc('close')}
          </Button>
        }
      >
        <p className="text-text-secondary text-[15px] leading-relaxed">{t('sheetBody')}</p>
      </Sheet>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t('dialogTitle')}
        closeLabel={tc('close')}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button variant="danger" onClick={() => setDialogOpen(false)}>
              {t('confirm')}
            </Button>
          </div>
        }
      >
        <p className="text-text-secondary text-[15px] leading-relaxed">{t('dialogBody')}</p>
      </Dialog>
    </main>
  );
}
