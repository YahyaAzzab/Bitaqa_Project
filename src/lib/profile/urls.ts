import { z } from 'zod';

const ALLOWED = new Set(['https:', 'tel:', 'mailto:']);

/** Refuse javascript:, data:, et tout schéma hors https / tel / mailto. */
export function isSafeProfileUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return ALLOWED.has(url.protocol);
  } catch {
    return false;
  }
}

export const safeUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isSafeProfileUrl, { message: 'url_unsafe' });

export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}

export function toWhatsAppHref(phoneOrUrl: string): string {
  if (phoneOrUrl.startsWith('http')) return phoneOrUrl;
  const digits = phoneOrUrl.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export function toMailtoHref(email: string): string {
  return `mailto:${email.trim()}`;
}

/** Construit une URL https sûre depuis @pseudo ou URL partielle. */
export function buildSocialUrl(
  type: 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'website' | 'custom',
  input: string,
): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return isSafeProfileUrl(raw) ? raw : null;
  }

  const handle = raw.replace(/^@/, '').replace(/^\/+/, '');

  switch (type) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'linkedin':
      return handle.includes('/')
        ? `https://linkedin.com/${handle}`
        : `https://linkedin.com/in/${handle}`;
    case 'website':
    case 'custom': {
      const withScheme = `https://${handle}`;
      return isSafeProfileUrl(withScheme) ? withScheme : null;
    }
    default:
      return null;
  }
}

export function extractSocialHandle(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1]?.replace(/^@/, '');
    return last || null;
  } catch {
    return null;
  }
}
