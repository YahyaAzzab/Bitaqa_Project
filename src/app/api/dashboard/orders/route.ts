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
  const { data, error } = await supabase
    .from('custom_orders')
    .select(
      'id, status, design_notes, logo_url, ordered_at, profiles(id, slug, business_name_fr, business_name_ar, phone)',
    )
    .neq('status', 'cancelled')
    .order('ordered_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }

  type Raw = {
    id: string;
    status: string;
    design_notes: string | null;
    logo_url: string | null;
    ordered_at: string;
    profiles:
      | {
          id: string;
          slug: string;
          business_name_fr: string;
          business_name_ar: string | null;
          phone: string | null;
        }
      | {
          id: string;
          slug: string;
          business_name_fr: string;
          business_name_ar: string | null;
          phone: string | null;
        }[]
      | null;
  };

  const orders = ((data ?? []) as Raw[]).flatMap((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!profile) return [];
    return [
      {
        id: row.id,
        status: row.status,
        design_notes: row.design_notes,
        logo_url: row.logo_url,
        ordered_at: row.ordered_at,
        profile,
      },
    ];
  });

  return NextResponse.json(
    { orders },
    { headers: { 'Cache-Control': 'private, max-age=15' } },
  );
}
