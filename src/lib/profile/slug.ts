/** Translittération arabe → latin approximative pour les slugs. */
const ARABIC_MAP: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'i',
  آ: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w',
  ي: 'y',
  ى: 'a',
  ة: 'a',
  ء: '',
  ئ: 'y',
  ؤ: 'w',
  'َ': '',
  'ُ': '',
  'ِ': '',
  'ّ': '',
  'ْ': '',
  'ً': '',
  'ٌ': '',
  'ٍ': '',
};

const RESERVED = new Set([
  'admin',
  'api',
  'app',
  'login',
  'dashboard',
  'c',
  'new',
  'static',
  'assets',
  '_next',
  'design',
  'settings',
  'profiles',
  'cash',
  'orders',
  'legal',
  'privacy',
  'terms',
]);

export function transliterateToSlug(input: string): string {
  const lowered = input.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  let out = '';
  for (const ch of lowered) {
    if (ARABIC_MAP[ch] !== undefined) {
      out += ARABIC_MAP[ch];
      continue;
    }
    if (/[a-z0-9]/.test(ch)) {
      out += ch;
      continue;
    }
    if (/[\s._/\\]+/.test(ch) || ch === '-' || ch === '&') {
      out += '-';
    }
  }
  return out
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 40;
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug);
}

export function suggestSlugAlternatives(base: string): string[] {
  const clean = isValidSlug(base) ? base : transliterateToSlug(base) || 'profil';
  const root = clean.slice(0, 36);
  return [`${root}-2`, `${root}-ma`, `${root}-casa`].filter(isValidSlug);
}
