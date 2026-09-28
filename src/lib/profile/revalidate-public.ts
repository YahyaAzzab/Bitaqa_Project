import { createHmac, timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { publicSiteUrl } from '@/lib/site-url';

const MAX_SKEW_MS = 5 * 60_000;

function revalidateSecret(): string {
  const secret = process.env.REVALIDATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Missing REVALIDATE_SECRET or SUPABASE_SERVICE_ROLE_KEY');
  return secret;
}

export function sign(slug: string, timestamp: string): string {
  return createHmac('sha256', revalidateSecret())
    .update(`revalidate:${slug}:${timestamp}`)
    .digest('base64url');
}

export function isValidRevalidateSignature(
  slug: string,
  timestamp: string,
  signature: string,
): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_SKEW_MS) return false;
  const expected = Buffer.from(sign(slug, timestamp));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function revalidatePublicProfileLocally(slug: string): void {
  revalidateTag(`profile:${slug}`);
  revalidatePath(`/fr/${slug}`);
  revalidatePath(`/ar/${slug}`);
}

/**
 * Cards always point at the production domain: a change saved from another deployment
 * (local dev, preview) must also purge the production cache, or the old page stays online.
 */
export async function revalidatePublicProfile(slug: string): Promise<void> {
  revalidatePublicProfileLocally(slug);
  if (process.env.VERCEL_ENV === 'production') return;

  const target = new URL('/api/revalidate', publicSiteUrl());
  if (['localhost', '127.0.0.1'].includes(target.hostname)) return;

  const timestamp = String(Date.now());
  try {
    await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, timestamp, signature: sign(slug, timestamp) }),
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    /* Production injoignable : son cache expire de lui-même sous 60 s. */
  }
}
