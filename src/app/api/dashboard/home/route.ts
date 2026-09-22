import { NextResponse } from 'next/server';
import { getSellerSession } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function startOfDayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function inDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export async function GET() {
  const session = await getSellerSession();
  if (!session || !isSupabaseConfigured()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const since = startOfDayIso();
  const isAdmin = session.seller.role === 'admin';
  const uid = session.userId;

  let profilesQuery = supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);
  if (!isAdmin) profilesQuery = profilesQuery.eq('created_by', uid);

  let salesQuery = supabase.from('sales').select('amount_mad').gte('collected_at', since);
  if (!isAdmin) salesQuery = salesQuery.eq('seller_id', uid);

  let recentQuery = supabase
    .from('profiles')
    .select('id, slug, business_name_fr, business_name_ar, logo_url, status, plan_code')
    .order('created_at', { ascending: false })
    .limit(3);
  if (!isAdmin) recentQuery = recentQuery.eq('created_by', uid);

  let renewQuery = supabase
    .from('profiles')
    .select('id, business_name_fr, expires_at')
    .eq('status', 'active')
    .lte('expires_at', inDays(30))
    .gte('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })
    .limit(5);
  if (!isAdmin) renewQuery = renewQuery.eq('created_by', uid);

  const readyQuery = supabase
    .from('custom_orders')
    .select('id, profile_id')
    .eq('status', 'ready')
    .limit(5);

  const [profilesRes, salesRes, recentRes, renewRes, readyRes] = await Promise.all([
    profilesQuery,
    salesQuery,
    recentQuery,
    renewQuery,
    readyQuery,
  ]);

  return NextResponse.json(
    {
      sellerName: session.seller.full_name,
      profilesToday: profilesRes.count ?? 0,
      collectedToday: (salesRes.data ?? []).reduce((sum, s) => sum + s.amount_mad, 0),
      recent: recentRes.data ?? [],
      renewSoon: renewRes.data ?? [],
      readyOrders: readyRes.data ?? [],
    },
    { headers: { 'Cache-Control': 'private, max-age=15' } },
  );
}
