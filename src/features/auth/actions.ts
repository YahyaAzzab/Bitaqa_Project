'use server';

import { redirect } from 'next/navigation';
import { loginSchema, type LoginState } from '@/lib/auth/schema';
import { safeDashboardNext } from '@/lib/auth/paths';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!seller) {
    await supabase.auth.signOut();
    return { error: 'forbidden' };
  }

  redirect(safeDashboardNext(next ?? null, locale));
}

export async function signOut(locale: 'fr' | 'ar') {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}
