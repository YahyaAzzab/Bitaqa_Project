import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured } from '@/lib/env';
import { detectDevice, hashVisitor, rateLimit } from '@/lib/rate-limit';
import { createServiceClient } from '@/lib/supabase/service';

const bodySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
});

/** Fenêtre de déduplication : même visiteur + profil, 3 minutes. */
const DEDUPE_MS = 3 * 60 * 1000;
const recent = new Map<string, number>();

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    null;

  const rl = rateLimit(`scan:${ip}`, { limit: 40, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const visitor = hashVisitor(ip, ua);
  const dedupeKey = `${parsed.data.slug}:${visitor}`;
  const now = Date.now();
  const last = recent.get(dedupeKey);
  if (last && now - last < DEDUPE_MS) {
    return NextResponse.json({ ok: true, deduped: true });
  }
  recent.set(dedupeKey, now);

  try {
    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, status')
      .eq('slug', parsed.data.slug)
      .maybeSingle();

    if (!profile || profile.status === 'suspended') {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await supabase.from('scans').insert({
      profile_id: profile.id,
      country,
      device: detectDevice(ua),
    });
  } catch {
    /* ne jamais faire échouer le client pour un scan */
  }

  return NextResponse.json({ ok: true });
}
