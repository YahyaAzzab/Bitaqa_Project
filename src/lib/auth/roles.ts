import type { AppRole, ProfileStatus, Seller } from '@/lib/supabase/database.types';

export type SellerViewer = Pick<Seller, 'id' | 'role'>;

/** Toute ligne `sellers` (admin compris) a accès à l’espace vendeur. */
export function hasSellerAccess(role: AppRole | null | undefined): boolean {
  return role === 'admin' || role === 'seller';
}

export function isAdmin(role: AppRole | null | undefined): boolean {
  return role === 'admin';
}

/** Miroir de la politique RLS `sales_read`. */
export function canReadSale(viewer: SellerViewer, saleSellerId: string): boolean {
  return isAdmin(viewer.role) || viewer.id === saleSellerId;
}

/** Miroir de `can_manage_profile`. */
export function canManageProfile(viewer: SellerViewer, profileCreatedBy: string): boolean {
  return isAdmin(viewer.role) || viewer.id === profileCreatedBy;
}

/** Lecture publique : tout sauf les profils suspendus. */
export function isPubliclyReadable(status: ProfileStatus): boolean {
  return status !== 'suspended';
}

export function filterReadableSales<T extends { seller_id: string }>(
  viewer: SellerViewer,
  sales: T[],
): T[] {
  return sales.filter((sale) => canReadSale(viewer, sale.seller_id));
}
