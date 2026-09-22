import { NextResponse } from 'next/server';
import { getPublicProfileBySlug } from '@/lib/profile/queries';
import { buildVCard } from '@/lib/profile/vcard';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile || profile.status === 'suspended') {
    return new NextResponse('Not found', { status: 404 });
  }

  const website = profile.links.find((l) => l.type === 'website')?.value ?? null;
  const vcard = buildVCard({
    nameFr: profile.business_name_fr,
    nameAr: profile.business_name_ar,
    orgFr: profile.business_name_fr,
    orgAr: profile.business_name_ar,
    phone: profile.phone,
    email: profile.email,
    website,
    addressFr: profile.address_fr,
    addressAr: profile.address_ar,
    logoUrl: profile.logo_url,
  });

  const filename = `${slug}.vcf`;
  return new NextResponse(vcard, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
