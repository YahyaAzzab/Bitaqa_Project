import { describe, expect, it } from 'vitest';
import { buildVCard } from '@/lib/profile/vcard';
import { isReservedSlug, isValidSlug, transliterateToSlug } from '@/lib/profile/slug';

describe('buildVCard', () => {
  it('génère une vCard 3.0 avec noms FR/AR', () => {
    const vcf = buildVCard({
      nameFr: 'Atelier Nour',
      nameAr: 'ورشة نور',
      phone: '+212661234567',
      email: 'bonjour@atelier-nour.ma',
      addressFr: 'Marrakech',
    });
    expect(vcf).toContain('BEGIN:VCARD');
    expect(vcf).toContain('VERSION:3.0');
    expect(vcf).toContain('Atelier Nour');
    expect(vcf).toContain('ورشة نور');
    expect(vcf).toContain('TEL;TYPE=CELL:+212661234567');
    expect(vcf).toContain('END:VCARD');
  });
});

describe('slug', () => {
  it('translittère et normalise', () => {
    expect(transliterateToSlug('Atelier Nour')).toBe('atelier-nour');
    expect(transliterateToSlug('Café & Thé')).toBe('cafe-the');
    expect(isValidSlug('atelier-nour')).toBe(true);
    expect(isValidSlug('ab')).toBe(false);
    expect(isReservedSlug('dashboard')).toBe(true);
  });

  it('translittère l’arabe', () => {
    const slug = transliterateToSlug('ورشة نور');
    expect(slug.length).toBeGreaterThan(2);
    expect(isValidSlug(slug) || slug.includes('-')).toBe(true);
  });
});
