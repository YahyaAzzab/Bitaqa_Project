import { beforeAll, describe, expect, it } from 'vitest';
import { decodeSellerProfile, encodeSellerProfile } from './seller-cookie';

const seller = {
  id: '4f1c2e8a-9b1d-4c55-8a1e-2f5d6c7b8a90',
  full_name: 'Yassine Ait',
  role: 'seller',
  created_at: '2026-09-01T10:00:00.000Z',
};

describe('seller cookie', () => {
  beforeAll(() => {
    process.env.SELLER_COOKIE_SECRET = 'test-secret-for-hmac';
  });

  it('round-trips a signed profile', async () => {
    const cookie = await encodeSellerProfile(seller);
    await expect(decodeSellerProfile(cookie)).resolves.toEqual(seller);
  });

  it('rejects a forged role', async () => {
    const cookie = await encodeSellerProfile(seller);
    const [, signature] = cookie.split('.');
    const forged = Buffer.from(JSON.stringify({ ...seller, role: 'admin' })).toString('base64url');
    await expect(decodeSellerProfile(`${forged}.${signature}`)).resolves.toBeNull();
  });

  it('rejects the old unsigned format', async () => {
    const unsigned = Buffer.from(JSON.stringify(seller)).toString('base64url');
    await expect(decodeSellerProfile(unsigned)).resolves.toBeNull();
    await expect(decodeSellerProfile('')).resolves.toBeNull();
  });
});
