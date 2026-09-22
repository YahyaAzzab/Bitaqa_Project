import { isSupabaseConfigured } from '@/lib/env';
import { createAnonClient } from '@/lib/supabase/anon';
import { parseHoursJson } from './hours';
import type { PublicProfile } from './types';

const PROFILE_SELECT = `
  id, slug, status, business_name_fr, business_name_ar,
  tagline_fr, tagline_ar, address_fr, address_ar,
  default_lang, logo_url, accent_color, theme,
  phone, email, hours, expires_at,
  profile_links ( id, type, label_fr, label_ar, value, position )
` as const;

function mapRow(row: {
  id: string;
  slug: string;
  status: PublicProfile['status'];
  business_name_fr: string;
  business_name_ar: string | null;
  tagline_fr: string | null;
  tagline_ar: string | null;
  address_fr: string | null;
  address_ar: string | null;
  default_lang: 'fr' | 'ar';
  logo_url: string | null;
  accent_color: string;
  theme: string;
  phone: string | null;
  email: string | null;
  hours: unknown;
  expires_at: string;
  profile_links: PublicProfile['links'] | null;
}): PublicProfile {
  const links = [...(row.profile_links ?? [])].sort((a, b) => a.position - b.position);
  const expiredByDate = new Date(row.expires_at).getTime() < Date.now();
  const status = row.status === 'active' && expiredByDate ? 'expired' : row.status;

  return {
    id: row.id,
    slug: row.slug,
    status,
    business_name_fr: row.business_name_fr,
    business_name_ar: row.business_name_ar,
    tagline_fr: row.tagline_fr,
    tagline_ar: row.tagline_ar,
    address_fr: row.address_fr,
    address_ar: row.address_ar,
    default_lang: row.default_lang,
    logo_url: row.logo_url,
    accent_color: row.accent_color,
    theme: row.theme,
    phone: row.phone,
    email: row.email,
    expires_at: row.expires_at,
    hours: parseHoursJson(row.hours),
    links,
  };
}

export async function getPublicProfileBySlug(slug: string): Promise<PublicProfile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapRow(data as Parameters<typeof mapRow>[0]);
  } catch {
    return null;
  }
}
