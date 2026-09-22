import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ReadyScreen } from '@/features/wizard/ready-screen';
import type { Locale } from '@/i18n/config';
import { getSellerSession } from '@/lib/auth/session';
import { env, isSupabaseConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function ReadyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const session = await getSellerSession();
  if (!session || !isSupabaseConfigured()) notFound();

  const supabase = await createServerSupabaseClient();
  let profileQuery = supabase
    .from('profiles')
    .select('id, slug, business_name_fr, business_name_ar, phone')
    .eq('slug', slug);

  if (session.seller.role !== 'admin') {
    profileQuery = profileQuery.eq('created_by', session.userId);
  }

  const { data: profile } = await profileQuery.maybeSingle();
  if (!profile) notFound();

  const site = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const profileUrl = `${site}/${locale}/${profile.slug}`;
  const name =
    locale === 'ar'
      ? profile.business_name_ar || profile.business_name_fr
      : profile.business_name_fr;

  return (
    <ReadyScreen
      slug={profile.slug}
      businessName={name}
      phone={profile.phone}
      profileUrl={profileUrl}
    />
  );
}
