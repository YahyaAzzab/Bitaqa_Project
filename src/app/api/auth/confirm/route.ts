import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { defaultLocale, locales, type Locale } from '@/i18n/config';
import { safeAccountNext, splitLocalePath } from '@/lib/auth/paths';
import { rateLimit } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const otpType = z.enum(['magiclink', 'email', 'recovery', 'invite', 'signup']);

function localeOf(next: string | null): Locale {
  if (!next) return defaultLocale;
  const { locale } = splitLocalePath(next);
  return locales.includes(locale) ? locale : defaultLocale;
}

/** Point d'arrivée des liens de connexion (WhatsApp du vendeur ou e-mail). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = searchParams.get('next');
  const locale = localeOf(next);
  const target = safeAccountNext(next, locale);
  const failure = new URL(`/${locale}/account/login?error=link`, origin);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`confirm:${ip}`, { limit: 20, windowMs: 10 * 60_000 }).ok) {
    return NextResponse.redirect(failure);
  }

  const supabase = await createServerSupabaseClient();
  const tokenHash = searchParams.get('token_hash');
  const type = otpType.safeParse(searchParams.get('type'));
  const code = searchParams.get('code');

  let ok = false;
  if (tokenHash && type.success) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type.data as EmailOtpType,
    });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  return NextResponse.redirect(ok ? new URL(target, origin) : failure);
}
