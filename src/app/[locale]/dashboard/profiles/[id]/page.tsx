import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProfileActions } from '@/features/profiles/profile-actions';
import type { Locale } from '@/i18n/config';
import { getSellerSession } from '@/lib/auth/session';
import { env, isSupabaseConfigured } from '@/lib/env';
import { formatMad } from '@/lib/money';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';

type ScanStats = {
  scans_7?: number;
  scans_30?: number;
  by_country?: Record<string, number>;
  by_device?: Record<string, number>;
};

function asScanStats(raw: Json | null): ScanStats {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  return {
    scans_7: typeof o.scans_7 === 'number' ? o.scans_7 : Number(o.scans_7) || 0,
    scans_30: typeof o.scans_30 === 'number' ? o.scans_30 : Number(o.scans_30) || 0,
    by_country:
      o.by_country && typeof o.by_country === 'object' && !Array.isArray(o.by_country)
        ? (o.by_country as Record<string, number>)
        : {},
    by_device:
      o.by_device && typeof o.by_device === 'object' && !Array.isArray(o.by_device)
        ? (o.by_device as Record<string, number>)
        : {},
  };
}

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'dashboard.profiles' });
  const session = await getSellerSession();
  if (!session || !isSupabaseConfigured()) notFound();

  const supabase = await createServerSupabaseClient();
  let q = supabase.from('profiles').select('*').eq('id', id);
  if (session.seller.role !== 'admin') {
    q = q.eq('created_by', session.userId);
  }
  const { data: profile } = await q.maybeSingle();
  if (!profile) notFound();

  const [salesRes, ordersRes, statsRes] = await Promise.all([
    supabase
      .from('sales')
      .select('id, kind, amount_mad, collected_at, plan_code')
      .eq('profile_id', profile.id)
      .order('collected_at', { ascending: false })
      .limit(10),
    supabase
      .from('custom_orders')
      .select('id, status, ordered_at, ready_at, swapped_at')
      .eq('profile_id', profile.id)
      .order('ordered_at', { ascending: false })
      .limit(5),
    supabase.rpc('profile_scan_stats', { p_profile_id: profile.id }),
  ]);

  const sales = salesRes.data;
  const orders = ordersRes.data;
  const stats = asScanStats(statsRes.data);

  const name =
    locale === 'ar'
      ? profile.business_name_ar || profile.business_name_fr
      : profile.business_name_fr;
  const site = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const publicUrl = `${site}/${locale}/${profile.slug}`;
  const expires = new Intl.DateTimeFormat(locale === 'ar' ? 'fr-MA' : 'fr-FR', {
    dateStyle: 'medium',
  }).format(new Date(profile.expires_at));

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={name} src={profile.logo_url} size={64} className="rounded-xl" />
        <div className="min-w-0">
          <p className="truncate text-[20px] font-semibold tracking-tight">{name}</p>
            <p className="text-text-muted text-[13px]" dir="ltr">
              /{profile.slug}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                tone={
                  profile.status === 'active'
                    ? 'success'
                    : profile.status === 'expired'
                      ? 'warning'
                      : 'error'
                }
              >
                {profile.status}
              </Badge>
              <Badge tone="accent">{profile.plan_code}</Badge>
            </div>
          </div>
        </div>

        <p className="text-text-secondary text-[14px]">{t('expires', { date: expires })}</p>

        <section>
          <h2 className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
            {t('scans')}
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="border-border bg-surface rounded-lg border p-4">
              <p className="text-text-muted text-[12px] uppercase">{t('scans7')}</p>
              <p className="tabular mt-2 text-[28px] font-semibold leading-none">
                {stats.scans_7 ?? 0}
              </p>
            </div>
            <div className="border-border bg-surface rounded-lg border p-4">
              <p className="text-text-muted text-[12px] uppercase">{t('scans30')}</p>
              <p className="tabular mt-2 text-[28px] font-semibold leading-none">
                {stats.scans_30 ?? 0}
              </p>
            </div>
          </div>
          {stats.by_country && Object.keys(stats.by_country).length > 0 ? (
            <ul className="text-text-secondary mt-3 space-y-1 text-[13px]">
              {Object.entries(stats.by_country)
                .slice(0, 5)
                .map(([country, count]) => (
                  <li key={country} className="flex justify-between">
                    <span dir="ltr">{country}</span>
                    <span className="tabular">{count}</span>
                  </li>
                ))}
            </ul>
          ) : null}
        </section>

        <ProfileActions
          profileId={profile.id}
          slug={profile.slug}
          planCode={profile.plan_code}
          isAdmin={session.seller.role === 'admin'}
          locale={locale}
          publicUrl={publicUrl}
        />

        <section>
          <h2 className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
            {t('sales')}
          </h2>
          <ul className="mt-2 space-y-2">
            {(sales ?? []).map((s) => (
              <li
                key={s.id}
                className="border-border bg-surface flex min-h-12 items-center justify-between rounded-md border px-3 text-[14px]"
              >
                <span>{s.kind}</span>
                <span className="tabular">{formatMad(s.amount_mad, locale)}</span>
              </li>
            ))}
          </ul>
        </section>

        {(orders ?? []).length > 0 ? (
          <section>
            <h2 className="text-text-muted text-[12px] font-medium tracking-[0.12em] uppercase">
              {t('orders')}
            </h2>
            <ul className="mt-2 space-y-2">
              {(orders ?? []).map((o) => (
                <li
                  key={o.id}
                  className="border-border bg-surface flex min-h-12 items-center justify-between rounded-md border px-3 text-[14px]"
                >
                  <span>{o.status}</span>
                  <span className="text-text-muted text-[12px]">
                    {new Intl.DateTimeFormat(locale === 'ar' ? 'fr-MA' : 'fr-FR').format(
                      new Date(o.ordered_at),
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
    </div>
  );
}
