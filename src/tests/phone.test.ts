import { describe, expect, it } from 'vitest';
import { formatNationalDisplay, normalizeMoroccanPhone, toNationalDigits } from '@/lib/phone';

describe('normalizeMoroccanPhone', () => {
  it('normalises a local 06 number', () => {
    expect(normalizeMoroccanPhone('0661234567')).toBe('+212661234567');
  });

  it('normalises +212 and 00212 prefixes', () => {
    expect(normalizeMoroccanPhone('+212661234567')).toBe('+212661234567');
    expect(normalizeMoroccanPhone('00212661234567')).toBe('+212661234567');
  });

  it('rejects incomplete numbers', () => {
    expect(normalizeMoroccanPhone('066123')).toBeNull();
    expect(normalizeMoroccanPhone('123')).toBeNull();
  });
});

describe('national formatting', () => {
  it('strips country code to 9 digits', () => {
    expect(toNationalDigits('+212661234567')).toBe('661234567');
  });

  it('groups for display', () => {
    expect(formatNationalDisplay('661234567')).toBe('6 61 23 45 67');
  });
});
