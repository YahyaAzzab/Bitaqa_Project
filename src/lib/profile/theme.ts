import type { ThemeName } from '@/components/providers';

/** Mappe la valeur stockée en base vers le thème CSS. */
export function resolveProfileTheme(theme: string | null | undefined): ThemeName {
  if (theme === 'ivoire' || theme === 'ivory' || theme === 'light') return 'ivoire';
  return 'noir';
}

export function themeToDb(theme: ThemeName): string {
  return theme === 'ivoire' ? 'ivoire' : 'noir';
}
