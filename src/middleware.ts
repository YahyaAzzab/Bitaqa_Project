import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { isDashboardPath, isLoginPath, splitLocalePath } from '@/lib/auth/paths';
import { copyCookies, updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const { user, supabase, response } = await updateSession(request, intlResponse);

  const { locale, path } = splitLocalePath(request.nextUrl.pathname);
  const dashboard = isDashboardPath(path);
  const login = isLoginPath(path);

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
      return redirectResponse;
    }

    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!seller) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set('error', 'forbidden');
      const redirectResponse = NextResponse.redirect(url);
      copyCookies(response, redirectResponse);
      return redirectResponse;
    }
  }

  if (login && user) {
    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (seller) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      url.search = '';
      const redirectResponse = NextResponse.redirect(url);
      copyCookies(response, redirectResponse);
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/(fr|ar)/:path*'],
};
