import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

import { isValidRevalidateSignature, sign } from '@/lib/profile/revalidate-public';

describe('revalidation signature', () => {
  beforeAll(() => {
    process.env.REVALIDATE_SECRET = 'test-secret';
  });

  it('accepts a fresh signature for the same slug', () => {
    const ts = String(Date.now());
    expect(isValidRevalidateSignature('atelier-nour', ts, sign('atelier-nour', ts))).toBe(true);
  });

  it('rejects a signature made for another slug', () => {
    const ts = String(Date.now());
    expect(isValidRevalidateSignature('studio-lina', ts, sign('atelier-nour', ts))).toBe(false);
  });

  it('rejects stale timestamps', () => {
    const ts = String(Date.now() - 10 * 60_000);
    expect(isValidRevalidateSignature('atelier-nour', ts, sign('atelier-nour', ts))).toBe(false);
  });

  it('rejects garbage', () => {
    expect(isValidRevalidateSignature('atelier-nour', String(Date.now()), 'nope')).toBe(false);
  });
});
