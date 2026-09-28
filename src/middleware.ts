import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { decodeSellerProfile, encodeSellerProfile } from '@/lib/auth/seller-cookie';
import {
  isAccountLoginPath,
  isAccountPath,
  isDashboardPath,
  isLoginPath,
  splitLocalePath,
} from '@/lib/auth/paths';
import { copyCookies, hasSupabaseAuthCookie, updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware(routing);

export const SELLER_COOKIE = 'bitaqa_seller';
export const SELLER_PROFILE_COOKIE = 'bitaqa_seller_profile';
const SELLER_COOKIE_MAX_AGE = 60 * 60 * 8;

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

async function setSellerCookies(
  response: NextResponse,
  seller: { id: string; full_name: string; role: string; created_at: string },
) {
  response.cookies.set(SELLER_COOKIE, seller.id, cookieOpts(SELLER_COOKIE_MAX_AGE));
  response.cookies.set(
    SELLER_PROFILE_COOKIE,
    await encodeSellerProfile(seller),
    cookieOpts(SELLER_COOKIE_MAX_AGE),
  );
}

async function hasValidSellerCookies(sellerId: string | undefined, profile: string | undefined) {
  if (!sellerId || !profile) return false;
  const decoded = await decodeSellerProfile(profile);
  return decoded?.id === sellerId;
}

async function handleAccount(request: NextRequest, intlResponse: NextResponse, locale: string) {
  const { path } = splitLocalePath(request.nextUrl.pathname);
  const loginPage = isAccountLoginPath(path);
  const hasAuth = hasSupabaseAuthCookie(request);

  if (!hasAuth) {
    if (loginPage) return intlResponse;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/account/login`;
    url.search = '';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Rafraîchit le jeton ; la page vérifie elle-même la propriété du profil.
  const { response } = await updateSession(request, intlResponse, { remote: true });
  return response;
}

export function clearSellerCookie(response: NextResponse) {
  response.cookies.set(SELLER_COOKIE, '', cookieOpts(0));
  response.cookies.set(SELLER_PROFILE_COOKIE, '', cookieOpts(0));
}

export default async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const { locale, path } = splitLocalePath(request.nextUrl.pathname);
  const dashboard = isDashboardPath(path);
  const login = isLoginPath(path);

  const sellerCookie = request.cookies.get(SELLER_COOKIE)?.value;
  const profileCookie = request.cookies.get(SELLER_PROFILE_COOKIE)?.value;
  const hasAuth = hasSupabaseAuthCookie(request);

  if (isAccountPath(path)) {
    return handleAccount(request, intlResponse, locale);
  }

  // Pages publiques : i18n seul, zéro Supabase.
  if (!dashboard && !login) {
    return intlResponse;
  }

  // Dashboard chaud : cookie vendeur signé + session → aucune I/O réseau.
  if (dashboard && hasAuth && (await hasValidSellerCookies(sellerCookie, profileCookie))) {
    return intlResponse;
  }

  // Login sans session : afficher le formulaire, pas d’Auth distant.
  if (login && !hasAuth) {
    return intlResponse;
  }

  // Cas restants : dashboard sans cookie vendeur, ou login avec session → vérifier.
  const { user, supabase, response } = await updateSession(request, intlResponse, {
    remote: true,
  });

  if (!supabase) {
    if (dashboard) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (dashboard) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set('next', request.nextUrl.pathname);
      const redirectResponse = NextResponse.redirect(url);
      copyCookies(response, redirectResponse);
      clearSellerCookie(redirectResponse);
      return redirectResponse;
    }

    const { data: seller } = await supabase
      .from('sellers')
      .select('id, full_name, role, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!seller) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set('error', 'forbidden');
      const redirectResponse = NextResponse.redirect(url);
      copyCookies(response, redirectResponse);
      clearSellerCookie(redirectResponse);
      return redirectResponse;
    }

    await setSellerCookies(response, seller);
    return response;
  }

  if (login && user) {
    const { data: seller } = await supabase
      .from('sellers')
      .select('id, full_name, role, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (seller) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      url.search = '';
      const redirectResponse = NextResponse.redirect(url);
      copyCookies(response, redirectResponse);
      await setSellerCookies(redirectResponse, seller);
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/(fr|ar)/:path*'],
};
