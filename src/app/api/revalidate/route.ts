import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { isValidSlug } from '@/lib/profile/slug';
import {
  isValidRevalidateSignature,
  revalidatePublicProfileLocally,
} from '@/lib/profile/revalidate-public';
import { rateLimit } from '@/lib/rate-limit';

const bodySchema = z.object({
  slug: z.string().refine(isValidSlug),
  timestamp: z.string().regex(/^\d{10,16}$/),
  signature: z.string().min(16).max(128),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`revalidate:${ip}`, { limit: 60, windowMs: 60_000 }).ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { slug, timestamp, signature } = parsed.data;
  if (!isValidRevalidateSignature(slug, timestamp, signature)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  revalidatePublicProfileLocally(slug);
  return NextResponse.json({ ok: true });
}
