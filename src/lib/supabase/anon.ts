import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/lib/env';
import type { Database } from '@/lib/supabase/database.types';

/** Client anon sans cookies — pour routes API / OG / ISR. */
export function createAnonClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
