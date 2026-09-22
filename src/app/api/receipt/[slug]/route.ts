import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { NextResponse } from 'next/server';
import { getSellerSession } from '@/lib/auth/session';
import { formatMad } from '@/lib/money';
import { isSupabaseConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const session = await getSellerSession();
  if (!session || !isSupabaseConfigured()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  let profileQuery = supabase
    .from('profiles')
    .select('id, slug, business_name_fr, business_name_ar, plan_code, default_lang')
    .eq('slug', slug);

  if (session.seller.role !== 'admin') {
    profileQuery = profileQuery.eq('created_by', session.userId);
  }

  const { data: profile } = await profileQuery.maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { data: sale } = await supabase
    .from('sales')
    .select('id, amount_mad, collected_at, kind, plan_code')
    .eq('profile_id', profile.id)
    .eq('kind', 'initial')
    .order('collected_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', session.userId);

  const receiptNo = String((count ?? 0) + 1).padStart(4, '0');
  const lang = profile.default_lang === 'ar' ? 'ar' : 'fr';
  const amount = sale?.amount_mad ?? 0;
  const dateStr = new Intl.DateTimeFormat(lang === 'ar' ? 'fr-MA' : 'fr-MA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(sale?.collected_at ? new Date(sale.collected_at) : new Date());

  const nameFr = profile.business_name_fr;
  const nameAr = profile.business_name_ar || profile.business_name_fr;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([395, 560]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.09, 0.07);
  const muted = rgb(0.45, 0.42, 0.38);
  const brass = rgb(0.79, 0.66, 0.43);

  let y = 520;
  page.drawText('BITAQA', { x: 40, y, size: 18, font: fontBold, color: brass });
  y -= 28;
  page.drawText(lang === 'ar' ? 'Recu / وصل' : 'Recu de vente', {
    x: 40,
    y,
    size: 14,
    font: fontBold,
    color: ink,
  });
  y -= 22;
  page.drawText(`N° ${receiptNo}`, { x: 40, y, size: 11, font, color: muted });
  y -= 36;

  const lines: Array<[string, string]> = [
    [lang === 'ar' ? 'Client' : 'Client', lang === 'ar' ? nameAr : nameFr],
    [lang === 'ar' ? 'Plan' : 'Plan', profile.plan_code],
    [lang === 'ar' ? 'Montant' : 'Montant', formatMad(amount, lang)],
    [lang === 'ar' ? 'Date' : 'Date', dateStr],
    [lang === 'ar' ? 'Vendeur' : 'Vendeur', session.seller.full_name],
    ['Lien', `bitaqa.ma/${profile.slug}`],
  ];

  for (const [label, value] of lines) {
    page.drawText(label, { x: 40, y, size: 9, font, color: muted });
    page.drawText(String(value).slice(0, 48), {
      x: 40,
      y: y - 14,
      size: 12,
      font: fontBold,
      color: ink,
    });
    y -= 40;
  }

  y -= 10;
  page.drawText('Paiement especes — Cash', {
    x: 40,
    y,
    size: 10,
    font,
    color: muted,
  });
  y -= 28;
  page.drawText('Merci — شكراً', { x: 40, y, size: 11, font: fontBold, color: ink });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bitaqa-recu-${profile.slug}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
