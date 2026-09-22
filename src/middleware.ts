import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { encodeSellerProfile } from '@/lib/auth/seller-cookie';
import { isDashboardPath, isLoginPath, splitLocalePath } from '@/lib/auth/paths';
import {
  copyCookies,
  hasSupabaseAuthCookie,
  updateSession,
} from '@/lib/supabase/middleware';

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

function setSellerCookies(
  response: NextResponse,
  seller: { id: string; full_name: string; role: string; created_at: string },
) {
  response.cookies.set(SELLER_COOKIE, seller.id, cookieOpts(SELLER_COOKIE_MAX_AGE));
  response.cookies.set(
    SELLER_PROFILE_COOKIE,
    encodeSellerProfile(seller),
    cookieOpts(SELLER_COOKIE_MAX_AGE),
  );
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

  // Pages publiques : i18n seul, zéro Supabase.
  if (!dashboard && !login) {
    return intlResponse;
  }

  // Dashboard chaud : les 3 cookies présents → aucune I/O.
  if (dashboard && sellerCookie && profileCookie && hasAuth) {
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

    setSellerCookies(response, seller);
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
      setSellerCookies(redirectResponse, seller);
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/(fr|ar)/:path*'],
};
