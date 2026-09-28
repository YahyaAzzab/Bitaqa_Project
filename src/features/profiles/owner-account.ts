import { createServiceClient } from '@/lib/supabase/service';

export type OwnerAccount = {
  email: string;
  /** Date du mot de passe attribué par l'équipe ; null si le commerçant a choisi le sien. */
  passwordSetAt: string | null;
};

export async function loadOwnerAccount(ownerId: string | null): Promise<OwnerAccount | null> {
  if (!ownerId) return null;
  const admin = createServiceClient();
  const [{ data: userData }, { data: credential }] = await Promise.all([
    admin.auth.admin.getUserById(ownerId),
    admin.from('owner_credentials').select('set_at').eq('user_id', ownerId).maybeSingle(),
  ]);
  const email = userData.user?.email;
  if (!email) return null;
  return { email, passwordSetAt: credential?.set_at ?? null };
}
