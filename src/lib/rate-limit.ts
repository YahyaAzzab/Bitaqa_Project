import { createHash } from 'node:crypto';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Rate limit en mémoire (par instance). Suffisant pour démarrer ; à remplacer par Redis en multi-région. */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}

export function hashVisitor(ip: string, ua: string): string {
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 24);
}

export function detectDevice(ua: string): string {
  const lower = ua.toLowerCase();
  if (/ipad|tablet/.test(lower)) return 'tablet';
  if (/mobi|iphone|android/.test(lower)) return 'mobile';
  return 'desktop';
}
