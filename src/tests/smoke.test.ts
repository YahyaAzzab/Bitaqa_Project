import { describe, it, expect } from 'vitest';

describe('Smoke test', () => {
  it('validates that the project loads', () => {
    expect(true).toBe(true);
  });

  it('validates locales are configured', async () => {
    const { locales, defaultLocale } = await import('@/i18n/config');
    expect(locales).toContain('fr');
    expect(locales).toContain('ar');
    expect(defaultLocale).toBe('fr');
  });

  it('validates RTL detection', async () => {
    const { isRtl } = await import('@/i18n/config');
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('fr')).toBe(false);
  });
});
