import { describe, expect, it } from 'vitest';
import { isDashboardPath, isLoginPath, safeDashboardNext, splitLocalePath } from './paths';

describe('auth paths', () => {
  it('splits locale prefixes', () => {
    expect(splitLocalePath('/fr/dashboard')).toEqual({ locale: 'fr', path: '/dashboard' });
    expect(splitLocalePath('/ar/login')).toEqual({ locale: 'ar', path: '/login' });
  });

  it('detects protected surfaces', () => {
    expect(isDashboardPath('/dashboard')).toBe(true);
    expect(isDashboardPath('/dashboard/profiles')).toBe(true);
    expect(isDashboardPath('/login')).toBe(false);
    expect(isLoginPath('/login')).toBe(true);
  });

  it('rejects open redirects', () => {
    expect(safeDashboardNext('https://evil.test', 'fr')).toBe('/fr/dashboard');
    expect(safeDashboardNext('//evil.test', 'fr')).toBe('/fr/dashboard');
    expect(safeDashboardNext('/fr/login', 'fr')).toBe('/fr/dashboard');
    expect(safeDashboardNext('/fr/dashboard/profiles', 'ar')).toBe('/fr/dashboard/profiles');
  });
});
