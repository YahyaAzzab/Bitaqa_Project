import { defaultLocale, locales, type Locale } from '@/i18n/config';

export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && locales.includes(first as Locale)) {
    const rest = `/${segments.slice(1).join('/')}`;
    return { locale: first as Locale, path: rest === '/' ? '/' : rest };
  }
  return { locale: defaultLocale, path: pathname.startsWith('/') ? pathname : `/${pathname}` };
}

export function isDashboardPath(path: string): boolean {
  return path === '/dashboard' || path.startsWith('/dashboard/');
}

export function isLoginPath(path: string): boolean {
  return path === '/login' || path.startsWith('/login/');
}

export function isAccountPath(path: string): boolean {
  return path === '/account' || path.startsWith('/account/');
}

export function isAccountLoginPath(path: string): boolean {
  return path === '/account/login' || path.startsWith('/account/login/');
}

/** N’accepte qu’un retour vers l’espace client de la même origine. */
export function safeAccountNext(raw: string | null, locale: Locale): string {
  const fallback = `/${locale}/account`;
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) {
    return fallback;
  }
  const { locale: nextLocale, path } = splitLocalePath(raw);
  if (!isAccountPath(path) || isAccountLoginPath(path)) {
    return fallback;
  }
  return `/${nextLocale}${path}`;
}

/** N’accepte qu’un retour vers le dashboard de la même origine. */
export function safeDashboardNext(raw: string | null, locale: Locale): string {
  const fallback = `/${locale}/dashboard`;
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return fallback;
  }
  const { locale: nextLocale, path } = splitLocalePath(raw);
  if (!isDashboardPath(path)) {
    return fallback;
  }
  return `/${nextLocale}${path === '/' ? '' : path}`;
}
