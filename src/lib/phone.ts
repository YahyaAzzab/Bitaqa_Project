const NATIONAL_PATTERN = /^[5-8]\d{8}$/;

/** Strip to digits only. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Normalise un numéro marocain vers E.164 (+212XXXXXXXXX).
 * Accepte 06…, 212…, +212…, 00212…
 */
export function normalizeMoroccanPhone(raw: string): string | null {
  let digits = digitsOnly(raw);
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  let national = digits;
  if (digits.startsWith('212')) {
    national = digits.slice(3);
  } else if (digits.startsWith('0')) {
    national = digits.slice(1);
  }
  if (!NATIONAL_PATTERN.test(national)) {
    return null;
  }
  return `+212${national}`;
}

/** 9 chiffres nationaux à partir d’un E.164 ou d’une saisie partielle. */
export function toNationalDigits(raw: string): string {
  let digits = digitsOnly(raw);
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('212')) {
    digits = digits.slice(3);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 9);
}

/** Affichage groupé : 6 12 34 56 78 */
export function formatNationalDisplay(nationalDigits: string): string {
  const d = toNationalDigits(nationalDigits);
  const parts: string[] = [];
  if (d.length > 0) parts.push(d.slice(0, 1));
  if (d.length > 1) parts.push(d.slice(1, 3));
  if (d.length > 3) parts.push(d.slice(3, 5));
  if (d.length > 5) parts.push(d.slice(5, 7));
  if (d.length > 7) parts.push(d.slice(7, 9));
  return parts.join(' ');
}
