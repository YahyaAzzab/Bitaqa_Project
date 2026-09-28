export const THEME_IDS = [
  'noir',
  'ivoire',
  'sable',
  'rose',
  'sauge',
  'marbre',
  'menthe',
  'emeraude',
  'nuit',
  'bordeaux',
  'argile',
  'ardoise',
] as const;

export type ThemeName = (typeof THEME_IDS)[number];

export type ThemeTone = 'dark' | 'light';

export type ThemeDefinition = {
  id: ThemeName;
  tone: ThemeTone;
  /** Accent proposé quand le vendeur choisit ce thème (modifiable ensuite). */
  accent: string;
};

/** Palettes complètes dans globals.css — ces valeurs doivent rester alignées. */
export const PROFILE_THEMES: readonly ThemeDefinition[] = [
  { id: 'noir', tone: 'dark', accent: '#c9a96e' },
  { id: 'ivoire', tone: 'light', accent: '#b8924a' },
  { id: 'sable', tone: 'light', accent: '#a4552f' },
  { id: 'rose', tone: 'light', accent: '#9e4f5a' },
  { id: 'sauge', tone: 'light', accent: '#56662f' },
  { id: 'marbre', tone: 'light', accent: '#1c1c1c' },
  { id: 'menthe', tone: 'light', accent: '#1f6b56' },
  { id: 'emeraude', tone: 'dark', accent: '#d4b06a' },
  { id: 'nuit', tone: 'dark', accent: '#c8b48a' },
  { id: 'bordeaux', tone: 'dark', accent: '#e3a996' },
  { id: 'argile', tone: 'dark', accent: '#d98a5c' },
  { id: 'ardoise', tone: 'dark', accent: '#9fbdd3' },
];

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

export function themeDefinition(id: ThemeName): ThemeDefinition {
  return PROFILE_THEMES.find((theme) => theme.id === id) ?? PROFILE_THEMES[0]!;
}
