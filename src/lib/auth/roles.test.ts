import { describe, expect, it } from 'vitest';
import {
  canManageProfile,
  canReadSale,
  filterReadableSales,
  hasSellerAccess,
  isAdmin,
  isPubliclyReadable,
} from './roles';

const admin = { id: 'admin-1', role: 'admin' as const };
const sellerA = { id: 'seller-a', role: 'seller' as const };
const sellerB = { id: 'seller-b', role: 'seller' as const };

describe('role helpers', () => {
  it('gives dashboard access to both seller and admin', () => {
    expect(hasSellerAccess('seller')).toBe(true);
    expect(hasSellerAccess('admin')).toBe(true);
    expect(hasSellerAccess(null)).toBe(false);
  });

  it('recognises admin only for admin role', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('seller')).toBe(false);
  });

  it('lets a seller read only their own sales', () => {
    expect(canReadSale(sellerA, 'seller-a')).toBe(true);
    expect(canReadSale(sellerA, 'seller-b')).toBe(false);
  });

  it('lets an admin read every sale', () => {
    expect(canReadSale(admin, 'seller-a')).toBe(true);
    expect(canReadSale(admin, 'seller-b')).toBe(true);
  });

  it('filters a mixed sales list the same way as RLS', () => {
    const sales = [
      { id: '1', seller_id: 'seller-a', amount_mad: 149 },
      { id: '2', seller_id: 'seller-b', amount_mad: 299 },
    ];

    expect(filterReadableSales(sellerA, sales).map((s) => s.id)).toEqual(['1']);
    expect(filterReadableSales(sellerB, sales).map((s) => s.id)).toEqual(['2']);
    expect(filterReadableSales(admin, sales).map((s) => s.id)).toEqual(['1', '2']);
  });

  it('lets a seller manage only profiles they created', () => {
    expect(canManageProfile(sellerA, 'seller-a')).toBe(true);
    expect(canManageProfile(sellerA, 'seller-b')).toBe(false);
    expect(canManageProfile(admin, 'seller-b')).toBe(true);
  });

  it('keeps public profiles readable without a session, except suspended', () => {
    expect(isPubliclyReadable('active')).toBe(true);
    expect(isPubliclyReadable('expired')).toBe(true);
    expect(isPubliclyReadable('suspended')).toBe(false);
  });
});
