import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSellerSession } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const querySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const session = await getSellerSession();
  if (!session || session.seller.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const now = new Date();
  const toDate = parsed.data.to ?? now.toISOString().slice(0, 10);
  const fromDate =
    parsed.data.from ??
    new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);

  const fromIso = `${fromDate}T00:00:00.000Z`;
  const toIso = `${toDate}T23:59:59.999Z`;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('sales')
    .select(
      'id, amount_mad, kind, plan_code, collected_at, note, seller_id, profiles(business_name_fr, slug), sellers(full_name)',
    )
    .gte('collected_at', fromIso)
    .lte('collected_at', toIso)
    .order('collected_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'generic' }, { status: 500 });
  }

  type ExportRow = {
    id: string;
    amount_mad: number;
    kind: string;
    plan_code: string;
    collected_at: string;
    note: string | null;
    seller_id: string;
    profiles: { business_name_fr: string; slug: string } | null;
    sellers: { full_name: string } | null;
  };

  const rows = (data ?? []) as ExportRow[];

  const header = [
    'id',
    'collected_at',
    'amount_mad',
    'kind',
    'plan_code',
    'seller',
    'business',
    'slug',
    'note',
  ];

  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.id,
        r.collected_at,
        String(r.amount_mad),
        r.kind,
        r.plan_code,
        csvEscape(r.sellers?.full_name ?? r.seller_id),
        csvEscape(r.profiles?.business_name_fr ?? ''),
        csvEscape(r.profiles?.slug ?? ''),
        csvEscape(r.note ?? ''),
      ].join(','),
    ),
  ];

  const body = `\uFEFF${lines.join('\n')}`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bitaqa-sales-${fromDate}-${toDate}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
