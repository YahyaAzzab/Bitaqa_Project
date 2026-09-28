import { beforeAll, describe, expect, it } from 'vitest';
import { decryptCredential, encryptCredential } from '@/lib/auth/credential-cipher';
import { generateOwnerPassword, OWNER_PASSWORD_MIN } from '@/lib/auth/owner-password';

describe('generateOwnerPassword', () => {
  it('produit un mot de passe lisible et assez long', () => {
    const password = generateOwnerPassword();
    expect(password).toMatch(/^[a-z]{4}-[a-z]{4}-\d{4}$/);
    expect(password.length).toBeGreaterThanOrEqual(OWNER_PASSWORD_MIN);
  });

  it('ne répète pas le même mot de passe', () => {
    const batch = new Set(Array.from({ length: 50 }, generateOwnerPassword));
    expect(batch.size).toBe(50);
  });
});

describe('credential cipher', () => {
  beforeAll(() => {
    process.env.OWNER_PASSWORD_KEY = 'test-owner-password-key';
  });

  it('chiffre puis déchiffre sans perte, avec un IV différent à chaque fois', () => {
    const a = encryptCredential('bako-rimu-4827');
    const b = encryptCredential('bako-rimu-4827');
    expect(a).not.toBe(b);
    expect(a).not.toContain('bako');
    expect(decryptCredential(a)).toBe('bako-rimu-4827');
  });

  it('refuse une valeur altérée ou une autre clé', () => {
    const payload = encryptCredential('secret-1234');
    const tampered = payload.slice(0, -2) + (payload.endsWith('A') ? 'BB' : 'AA');
    expect(decryptCredential(tampered)).toBeNull();
    expect(decryptCredential('v1.bad')).toBeNull();

    process.env.OWNER_PASSWORD_KEY = 'another-key';
    expect(decryptCredential(payload)).toBeNull();
  });
});
