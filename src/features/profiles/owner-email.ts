import { createServiceClient } from '@/lib/supabase/service';

export async function loadOwnerEmail(ownerId: string | null): Promise<string | null> {
  if (!ownerId) return null;
  const { data } = await createServiceClient().auth.admin.getUserById(ownerId);
  return data.user?.email ?? null;
}
