import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProfileView } from '@/features/profile/profile-view';
import type { Locale } from '@/i18n/config';
import { env, isSupabaseConfigured } from '@/lib/env';
import { getCachedPublicProfile } from '@/lib/profile/cache';
import { resolveProfileTheme } from '@/lib/profile/theme';
import type { ProfilePreviewData, PublicProfile } from '@/lib/profile/types';

export const revalidate = 60;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

const RESERVED = new Set([
  'login',
  'dashboard',
  'design',
  'api',
  'settings',
  'legal',
  'privacy',
  'terms',
  'manifest.webmanifest',
]);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;

  if (RESERVED.has(slug)) {
    return { title: 'Bitaqa' };
  }

  const profile = await getCachedPublicProfile(slug);
  if (!profile) {
    const t = await getTranslations({ locale, namespace: 'profile' });
    return { title: t('notFoundTitle') };
  }

  const name =
    locale === 'ar'
      ? profile.business_name_ar || profile.business_name_fr
      : profile.business_name_fr;
  const description =
    (locale === 'ar' ? profile.tagline_ar : profile.tagline_fr) ||
    (locale === 'ar' ? profile.tagline_fr : profile.tagline_ar) ||
    undefined;

  const site = isSupabaseConfigured() ? env.NEXT_PUBLIC_SITE_URL : 'http://localhost:3000';
  const url = `${site}/${locale}/${slug}`;

  return {
    title: `${name} · Bitaqa`,
    description,
    alternates: {
      canonical: url,
      languages: {
        fr: `${site}/fr/${slug}`,
        ar: `${site}/ar/${slug}`,
      },
    },
    openGraph: {
      title: name,
      description,
      url,
      type: 'profile',
      images: [{ url: `${site}/api/og/${slug}`, width: 1200, height: 630 }],
    },
    robots:
      profile.status === 'suspended'
        ? { index: false, follow: false }
        : { index: true, follow: true },
  };
}

function toPreview(profile: PublicProfile): ProfilePreviewData & {
  slug: string;
  defaultLang: 'fr' | 'ar';
} {
  return {
    slug: profile.slug,
    defaultLang: profile.default_lang,
    businessNameFr: profile.business_name_fr,
    businessNameAr: profile.business_name_ar ?? undefined,
    taglineFr: profile.tagline_fr ?? undefined,
    taglineAr: profile.tagline_ar ?? undefined,
    addressFr: profile.address_fr ?? undefined,
    addressAr: profile.address_ar ?? undefined,
    logoUrl: profile.logo_url,
    accentColor: profile.accent_color,
    theme: resolveProfileTheme(profile.theme),
    phone: profile.phone ?? undefined,
    email: profile.email ?? undefined,
    hours: profile.hours,
    expired: profile.status === 'expired',
    links: profile.links.map((l) => ({
      type: l.type,
      labelFr: l.label_fr ?? undefined,
      labelAr: l.label_ar ?? undefined,
      value: l.value,
    })),
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  if (RESERVED.has(slug)) {
    notFound();
  }

  const profile = await getCachedPublicProfile(slug);
  if (!profile || profile.status === 'suspended') {
    notFound();
  }

  const site = isSupabaseConfigured()
    ? env.NEXT_PUBLIC_SITE_URL
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const profileUrl = `${site.replace(/\/$/, '')}/${locale}/${slug}`;
  const data = toPreview(profile);

  return (
    <ProfileView data={data} profileUrl={profileUrl} locale={locale} />
  );
}
