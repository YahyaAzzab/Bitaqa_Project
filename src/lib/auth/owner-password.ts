const CONSONANTS = 'bdfgklmnprstvz';
const VOWELS = 'aeiou';

export const OWNER_PASSWORD_MIN = 8;
export const OWNER_PASSWORD_MAX = 72;

function randomIndex(max: number): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0]! % max;
}

function syllables(count: number): string {
  let out = '';
  for (let i = 0; i < count; i += 1) {
    out += CONSONANTS[randomIndex(CONSONANTS.length)]! + VOWELS[randomIndex(VOWELS.length)]!;
  }
  return out;
}

/** Facile à dicter au téléphone et à taper sur un clavier mobile : « bako-rimu-4827 ». */
export function generateOwnerPassword(): string {
  const digits = String(randomIndex(10_000)).padStart(4, '0');
  return `${syllables(2)}-${syllables(2)}-${digits}`;
}
