export type VCardInput = {
  nameFr: string;
  nameAr?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  addressFr?: string | null;
  addressAr?: string | null;
  logoUrl?: string | null;
  orgFr?: string | null;
  orgAr?: string | null;
};

function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 0) {
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return chunks.join('\r\n');
}

/** Génère une vCard 3.0 UTF-8 (noms FR + AR). */
export function buildVCard(input: VCardInput): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  const fn = input.nameFr.trim() || input.nameAr?.trim() || 'Contact';
  lines.push(`FN;CHARSET=UTF-8:${escapeVCard(fn)}`);

  if (input.nameAr?.trim() && input.nameAr.trim() !== fn) {
    lines.push(`FN;CHARSET=UTF-8;LANGUAGE=ar:${escapeVCard(input.nameAr.trim())}`);
  }

  const org = input.orgFr?.trim() || input.nameFr.trim();
  if (org) {
    lines.push(`ORG;CHARSET=UTF-8:${escapeVCard(org)}`);
  }
  if (input.orgAr?.trim() && input.orgAr.trim() !== org) {
    lines.push(`ORG;CHARSET=UTF-8;LANGUAGE=ar:${escapeVCard(input.orgAr.trim())}`);
  }

  if (input.phone?.trim()) {
    lines.push(`TEL;TYPE=CELL:${escapeVCard(input.phone.trim())}`);
  }
  if (input.email?.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(input.email.trim())}`);
  }
  if (input.website?.trim()) {
    lines.push(`URL:${escapeVCard(input.website.trim())}`);
  }

  const addr = input.addressFr?.trim() || input.addressAr?.trim();
  if (addr) {
    lines.push(`ADR;CHARSET=UTF-8;TYPE=WORK:;;${escapeVCard(addr)};;;;`);
  }

  if (input.logoUrl?.trim() && input.logoUrl.startsWith('https://')) {
    lines.push(`PHOTO;VALUE=URI:${escapeVCard(input.logoUrl.trim())}`);
  }

  lines.push('END:VCARD');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
