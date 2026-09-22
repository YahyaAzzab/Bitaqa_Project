import { cache } from 'react';
import { cookies } from 'next/headers';
import { decodeSellerProfile, encodeSellerProfile } from '@/lib/auth/seller-cookie';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Seller } from '@/lib/supabase/database.types';

const SELLER_PROFILE_COOKIE = 'bitaqa_seller_profile';
const SELLER_COOKIE = 'bitaqa_seller';
const COOKIE_MAX_AGE = 60 * 60 * 8;

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

async function writeSellerCookies(seller: Seller) {
  try {
    const store = await cookies();
    store.set(SELLER_COOKIE, seller.id, cookieOpts(COOKIE_MAX_AGE));
    store.set(SELLER_PROFILE_COOKIE, encodeSellerProfile(seller), cookieOpts(COOKIE_MAX_AGE));
  } catch {
    /* hors mutation parfois */
  }
}

/**
 * Session vendeur — 1× par requête (React cache).
 * Cookie profil d’abord (0 réseau), sinon Auth + sellers.
 */
export const getSellerSession = cache(async (): Promise<{
  userId: string;
  seller: Seller;
} | null> => {
  const store = await cookies();
  const cached = decodeSellerProfile(store.get(SELLER_PROFILE_COOKIE)?.value ?? '');
  const sellerId = store.get(SELLER_COOKIE)?.value;

  if (cached && sellerId === cached.id) {
    return { userId: cached.id, seller: cached };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!seller) {
    return null;
  }

  await writeSellerCookies(seller);
  return { userId: user.id, seller };
});
