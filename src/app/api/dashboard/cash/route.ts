import { NextResponse } from 'next/server';
import { getSellerSession } from '@/lib/auth/session';
import { getPeriodBounds } from '@/lib/dashboard/cash';
import { isSupabaseConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSellerSession();
  if (!session || !isSupabaseConfigured()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const isAdmin = session.seller.role === 'admin';
  const bounds = getPeriodBounds();
  const sinceMs = Math.min(bounds.monthStart.getTime(), bounds.last30Start.getTime());
  const sinceIso = new Date(sinceMs).toISOString();

  let salesQuery = supabase
    .from('sales')
    .select('id, amount_mad, kind, collected_at, profiles(business_name_fr, business_name_ar)')
    .gte('collected_at', sinceIso)
    .order('collected_at', { ascending: false });

  if (!isAdmin) {
    salesQuery = salesQuery.eq('seller_id', session.userId);
  }

  if (isAdmin) {
    const [salesRes, balanceRes, sellersRes] = await Promise.all([
      salesQuery,
      supabase.from('seller_cash_balance').select('*'),
      supabase.from('sellers').select('id, full_name').order('full_name'),
    ]);
    return NextResponse.json(
      {
        sales: salesRes.data ?? [],
        balances: balanceRes.data ?? [],
        sellers: sellersRes.data ?? [],
        isAdmin: true,
      },
      { headers: { 'Cache-Control': 'private, max-age=15' } },
    );
  }

  const { data: sales } = await salesQuery;
  return NextResponse.json(
    { sales: sales ?? [], balances: [], sellers: [], isAdmin: false },
    { headers: { 'Cache-Control': 'private, max-age=15' } },
  );
}
