import { isThemeName, type ThemeName } from './themes';

/** Mappe la valeur stockée en base vers le thème CSS. */
export function resolveProfileTheme(theme: string | null | undefined): ThemeName {
  if (isThemeName(theme)) return theme;
  if (theme === 'ivory' || theme === 'light') return 'ivoire';
  return 'noir';
}

export function themeToDb(theme: ThemeName): string {
  return theme;
}
