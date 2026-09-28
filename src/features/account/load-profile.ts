import { parseHoursJson, type DayKey } from '@/lib/profile/hours';
import { DEFAULT_WEEKLY_HOURS, type OwnerProfileValues } from '@/lib/profile/schema';
import { resolveProfileTheme } from '@/lib/profile/theme';
import type { Json } from '@/lib/supabase/database.types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type OwnerProfileMeta = {
  id: string;
  slug: string;
  status: 'active' | 'expired' | 'suspended';
  planCode: string;
  expiresAt: string;
  defaultLang: 'fr' | 'ar';
  editable: boolean;
};

export type OwnerScanStats = {
  scans7: number;
  scans30: number;
  daily: Array<{ day: string; count: number }>;
  byCountry: Array<[string, number]>;
  byDevice: Array<[string, number]>;
};

const SYSTEM_LINK_TYPES = new Set(['phone', 'whatsapp', 'email', 'maps']);
const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function digits(value: string): string {
  return value.replace(/\D/g, '');
}

function toEntries(raw: unknown): Array<[string, number]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>)
    .map(([key, value]): [string, number] => [key, Number(value) || 0])
    .sort((a, b) => b[1] - a[1]);
}

function parseStats(raw: Json | null): OwnerScanStats {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const daily = Array.isArray(o.daily)
    ? o.daily.flatMap((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
        return typeof item.day === 'string'
          ? [{ day: item.day, count: Number(item.count) || 0 }]
          : [];
      })
    : [];
  return {
    scans7: Number(o.scans_7) || 0,
    scans30: Number(o.scans_30) || 0,
    daily,
    byCountry: toEntries(o.by_country),
    byDevice: toEntries(o.by_device),
  };
}

export async function loadOwnerProfile(profileId: string) {
  const supabase = await createServerSupabaseClient();
  const [{ data: profile }, { data: links }, { data: stats }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', profileId).maybeSingle(),
    supabase
      .from('profile_links')
      .select('id, type, label_fr, label_ar, value, position')
      .eq('profile_id', profileId)
      .order('position', { ascending: true }),
    supabase.rpc('profile_scan_stats', { p_profile_id: profileId }),
  ]);
  if (!profile) return null;

  const rows = links ?? [];
  const whatsapp = rows.find((l) => l.type === 'whatsapp')?.value;
  const phoneDigits = profile.phone ? digits(profile.phone) : '';
  const whatsappDigits = whatsapp ? digits(whatsapp) : '';
  const whatsappSame = !whatsappDigits || whatsappDigits === phoneDigits;
  const hours = parseHoursJson(profile.hours);

  const values: OwnerProfileValues = {
    profileId: profile.id,
    businessNameFr: profile.business_name_fr,
    businessNameAr: profile.business_name_ar ?? '',
    taglineFr: profile.tagline_fr ?? '',
    taglineAr: profile.tagline_ar ?? '',
    phone: profile.phone ?? '',
    whatsappSame,
    whatsapp: whatsappSame ? '' : `+${whatsappDigits}`,
    email: profile.email ?? '',
    addressFr: profile.address_fr ?? '',
    mapsUrl: rows.find((l) => l.type === 'maps')?.value ?? '',
    logoUrl: profile.logo_url,
    hoursEnabled: hours !== null,
    hours: hours
      ? (Object.fromEntries(DAYS.map((d) => [d, hours[d] ?? []])) as OwnerProfileValues['hours'])
      : DEFAULT_WEEKLY_HOURS,
    theme: resolveProfileTheme(profile.theme),
    accentColor: profile.accent_color,
    links: rows
      .filter((l) => !SYSTEM_LINK_TYPES.has(l.type))
      .map((l) => ({
        key: l.id,
        type: l.type,
        labelFr: l.label_fr ?? '',
        labelAr: l.label_ar ?? '',
        value: l.value,
      })),
  };

  const meta: OwnerProfileMeta = {
    id: profile.id,
    slug: profile.slug,
    status: profile.status,
    planCode: profile.plan_code,
    expiresAt: profile.expires_at,
    defaultLang: profile.default_lang === 'ar' ? 'ar' : 'fr',
    editable: profile.status === 'active' && new Date(profile.expires_at).getTime() > Date.now(),
  };

  return { values, meta, stats: parseStats(stats) };
}
