import { NextResponse } from 'next/server';
import { getSellerSession } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSellerSession();
  if (!session || !isSupabaseConfigured()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  let q = supabase
    .from('profiles')
    .select(
      'id, slug, business_name_fr, business_name_ar, logo_url, status, plan_code, expires_at, phone',
    )
    .order('created_at', { ascending: false })
    .limit(500);

  if (session.seller.role !== 'admin') {
    q = q.eq('created_by', session.userId);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }

  return NextResponse.json(
    { profiles: data ?? [] },
    { headers: { 'Cache-Control': 'private, max-age=15' } },
  );
}
