import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';

/**
 * Service role client for server-side admin operations.
 * Bypasses RLS — use with extreme caution and never expose to the client.
 */
export function createServiceClient() {
  const serverEnv = getServerEnv();
  return createClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
