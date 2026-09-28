import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type OwnedProfileSummary = {
  id: string;
  slug: string;
  businessNameFr: string;
  businessNameAr: string | null;
  logoUrl: string | null;
};

export type AccountSession = {
  userId: string;
  email: string;
  passwordSet: boolean;
  isSeller: boolean;
  profiles: OwnedProfileSummary[];
};

/** Session commerçant — Auth distant 1× par requête, la propriété est relue en base. */
export const getAccountSession = cache(async (): Promise<AccountSession | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profiles }, { data: seller }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, slug, business_name_fr, business_name_ar, logo_url')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase.from('sellers').select('id').eq('id', user.id).maybeSingle(),
  ]);

  return {
    userId: user.id,
    email: user.email ?? '',
    passwordSet: user.user_metadata?.password_set === true,
    isSeller: Boolean(seller),
    profiles: (profiles ?? []).map((p) => ({
      id: p.id,
      slug: p.slug,
      businessNameFr: p.business_name_fr,
      businessNameAr: p.business_name_ar,
      logoUrl: p.logo_url,
    })),
  };
});
