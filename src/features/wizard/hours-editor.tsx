'use client';

import { CopyCheck, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { Switch } from '@/components/ui/switch';
import type { DayKey } from '@/lib/profile/hours';
import { areDaySlotsValid, type WeeklyHoursInput } from '@/lib/profile/schema';
import { cn } from '@/lib/utils';

type Slot = [string, string];

const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const PRESETS = {
  weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  monSat: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  everyday: DAYS,
} satisfies Record<string, DayKey[]>;

type PresetKey = keyof typeof PRESETS;

const PRESET_LABELS: Record<PresetKey, 'hoursPresetWeekdays' | 'hoursPresetMonSat' | 'hoursPresetEveryday'> = {
  weekdays: 'hoursPresetWeekdays',
  monSat: 'hoursPresetMonSat',
  everyday: 'hoursPresetEveryday',
};

const FALLBACK_SLOTS: Slot[] = [['09:00', '19:00']];

type Props = {
  value: WeeklyHoursInput;
  onChange: (next: WeeklyHoursInput) => void;
};

function cloneSlots(slots: readonly Slot[]): Slot[] {
  return slots.map(([start, end]) => [start, end]);
}

function withBreak([start, end]: Slot): Slot[] {
  if (start < '13:00' && end > '15:00') return [[start, '13:00'], ['15:00', end]];
  return [[start, end], [end < '20:00' ? '20:00' : end, '23:00']];
}

export function HoursEditor({ value, onChange }: Props) {
  const t = useTranslations('dashboard.wizard');
  const tDay = useTranslations('profile.day');

  const firstOpenDay = DAYS.find((day) => value[day].length > 0);
  const reference = firstOpenDay ? value[firstOpenDay] : FALLBACK_SLOTS;
  const openDays = DAYS.filter((day) => value[day].length > 0);

  const setDay = (day: DayKey, slots: Slot[]) => onChange({ ...value, [day]: slots });

  const applyPreset = (days: readonly DayKey[]) => {
    const next = { ...value };
    for (const day of DAYS) next[day] = days.includes(day) ? cloneSlots(reference) : [];
    onChange(next);
  };

  const copyToOpenDays = (source: DayKey) => {
    const next = { ...value };
    for (const day of openDays) next[day] = cloneSlots(value[source]);
    onChange(next);
  };

  const updateSlot = (day: DayKey, index: number, part: 0 | 1, time: string) => {
    const slots = cloneSlots(value[day]);
    const slot = slots[index];
    if (!slot) return;
    slot[part] = time;
    setDay(day, slots);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('hours')}>
        {(Object.keys(PRESETS) as PresetKey[]).map((key) => {
          const days = PRESETS[key];
          const selected =
            openDays.length === days.length && days.every((day) => value[day].length > 0);
          return (
            <Chip key={key} selected={selected} onSelect={() => applyPreset(days)}>
              {t(PRESET_LABELS[key])}
            </Chip>
          );
        })}
      </div>

      <ul className="border-border bg-surface divide-border divide-y rounded-lg border">
        {DAYS.map((day) => {
          const slots = value[day];
          const open = slots.length > 0;
          const valid = areDaySlotsValid(slots);
          return (
            <li key={day} className="px-4 py-2">
              <Switch
                id={`hours-${day}`}
                label={tDay(day)}
                description={open ? undefined : t('hoursClosed')}
                checked={open}
                onCheckedChange={(on) => setDay(day, on ? cloneSlots(reference) : [])}
              />

              {open ? (
                <div className="mt-2 space-y-2 pb-1">
                  {slots.map(([start, end], index) => (
                    <div key={index} className="flex items-center gap-2" dir="ltr">
                      <TimeInput
                        value={start}
                        label={`${tDay(day)} · ${t('hoursFrom')}`}
                        invalid={!valid}
                        onChange={(time) => updateSlot(day, index, 0, time)}
                      />
                      <span className="text-text-muted" aria-hidden>
                        –
                      </span>
                      <TimeInput
                        value={end}
                        label={`${tDay(day)} · ${t('hoursTo')}`}
                        invalid={!valid}
                        onChange={(time) => updateSlot(day, index, 1, time)}
                      />
                      {index > 0 ? (
                        <IconButton
                          label={t('hoursRemoveBreak')}
                          className="text-text-secondary shrink-0"
                          onClick={() => setDay(day, slots.slice(0, 1))}
                        >
                          <X className="size-[18px]" strokeWidth={1.75} />
                        </IconButton>
                      ) : null}
                    </div>
                  ))}

                  {!valid ? (
                    <p role="alert" className="text-error text-[13px]">
                      {t('hoursInvalid')}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-x-4">
                    {slots.length < 2 ? (
                      <button
                        type="button"
                        className="pressable focus-ring text-accent inline-flex min-h-12 items-center gap-1.5 rounded-md text-[13px] font-medium"
                        onClick={() => setDay(day, withBreak(slots[0] ?? FALLBACK_SLOTS[0]!))}
                      >
                        <Plus className="size-4" strokeWidth={1.75} aria-hidden />
                        {t('hoursAddBreak')}
                      </button>
                    ) : null}
                    {day === firstOpenDay && openDays.length > 1 ? (
                      <button
                        type="button"
                        className="pressable focus-ring text-text-secondary hover:text-text inline-flex min-h-12 items-center gap-1.5 rounded-md text-[13px] font-medium"
                        onClick={() => copyToOpenDays(day)}
                      >
                        <CopyCheck className="size-4" strokeWidth={1.75} aria-hidden />
                        {t('hoursCopy')}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TimeInput({
  value,
  label,
  invalid,
  onChange,
}: {
  value: string;
  label: string;
  invalid: boolean;
  onChange: (time: string) => void;
}) {
  return (
    <input
      type="time"
      step={900}
      value={value}
      aria-label={label}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'focus-ring bg-bg text-text tabular h-12 min-w-0 flex-1 rounded-md border px-3 text-[16px]',
        invalid ? 'border-error' : 'border-border',
      )}
    />
  );
}
