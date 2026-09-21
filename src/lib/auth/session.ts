import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Seller } from '@/lib/supabase/database.types';

export async function getSellerSession(): Promise<{
  userId: string;
  seller: Seller;
} | null> {
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

  return { userId: user.id, seller };
}
