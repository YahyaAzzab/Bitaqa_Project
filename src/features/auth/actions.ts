'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginSchema, type LoginState } from '@/lib/auth/schema';
import { safeDashboardNext } from '@/lib/auth/paths';
import { encodeSellerProfile } from '@/lib/auth/seller-cookie';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    locale: formData.get('locale'),
    next: formData.get('next') || undefined,
  });

  if (!parsed.success) {
    return { error: 'invalid' };
  }

  const { email, password, locale, next } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const status = error.status;
    if (status === 400 || status === 401) {
      return { error: 'invalid' };
    }
    return { error: 'generic' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'generic' };
  }

  const { data: seller } = await supabase
    .from('sellers')
    .select('id, full_name, role, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (!seller) {
    await supabase.auth.signOut();
    return { error: 'forbidden' };
  }

  const cookieStore = await cookies();
  cookieStore.set('bitaqa_seller', user.id, cookieOpts(COOKIE_MAX_AGE));
  cookieStore.set('bitaqa_seller_profile', encodeSellerProfile(seller), cookieOpts(COOKIE_MAX_AGE));

  redirect(safeDashboardNext(next ?? null, locale));
}

export async function signOut(locale: 'fr' | 'ar') {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.set('bitaqa_seller', '', cookieOpts(0));
  cookieStore.set('bitaqa_seller_profile', '', cookieOpts(0));
  redirect(`/${locale}/login`);
}
