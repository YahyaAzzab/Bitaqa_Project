import { describe, expect, it } from 'vitest';
import { buildSocialUrl, isSafeProfileUrl, extractSocialHandle } from '@/lib/profile/urls';

describe('isSafeProfileUrl', () => {
  it('accepte https, tel, mailto', () => {
    expect(isSafeProfileUrl('https://example.com')).toBe(true);
    expect(isSafeProfileUrl('tel:+212661234567')).toBe(true);
    expect(isSafeProfileUrl('mailto:a@b.ma')).toBe(true);
  });

  it('refuse javascript et data', () => {
    expect(isSafeProfileUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeProfileUrl('data:text/html,hi')).toBe(false);
    expect(isSafeProfileUrl('ftp://x')).toBe(false);
  });
});

describe('buildSocialUrl', () => {
  it('reconstruit depuis un @pseudo', () => {
    expect(buildSocialUrl('instagram', '@atelier.nour')).toBe('https://instagram.com/atelier.nour');
    expect(buildSocialUrl('tiktok', 'studiolina')).toBe('https://www.tiktok.com/@studiolina');
  });

  it('conserve une URL https valide', () => {
    expect(buildSocialUrl('website', 'https://cuivrefil.ma')).toBe('https://cuivrefil.ma');
  });

  it('transforme un numéro WhatsApp en lien wa.me', () => {
    expect(buildSocialUrl('whatsapp', '06 12 34 56 78')).toBe('https://wa.me/212612345678');
    expect(buildSocialUrl('whatsapp', '+33 6 12 34 56 78')).toBe('https://wa.me/33612345678');
    expect(buildSocialUrl('whatsapp', 'chat.whatsapp.com/AbCdEf')).toBe(
      'https://chat.whatsapp.com/AbCdEf',
    );
  });

  it('refuse un lien WhatsApp qui ne mène pas à WhatsApp', () => {
    expect(buildSocialUrl('whatsapp', 'https://evil.example/wa.me')).toBeNull();
    expect(buildSocialUrl('whatsapp', '12345')).toBeNull();
    expect(buildSocialUrl('whatsapp', 'javascript:alert(1)')).toBeNull();
  });
});

describe('extractSocialHandle', () => {
  it('extrait le dernier segment', () => {
    expect(extractSocialHandle('https://instagram.com/atelier.nour')).toBe('atelier.nour');
  });
});
