import type { SupabaseClient } from '@supabase/supabase-js';
import { encryptCredential } from '@/lib/auth/credential-cipher';
import { generateOwnerPassword } from '@/lib/auth/owner-password';
import { publicSiteUrl } from '@/lib/site-url';
import type { Database } from '@/lib/supabase/database.types';
import { createServiceClient } from '@/lib/supabase/service';

export type OwnerProvisionResult =
  { ok: true; link: string; email: string } | { ok: false; error: 'email_is_seller' | 'generic' };

/**
 * Crée (ou retrouve) le compte du commerçant, le rattache au profil et renvoie
 * un lien de connexion à usage unique, envoyé par le vendeur sur WhatsApp.
 * Le rattachement passe par le client du vendeur : la RLS confirme qu'il gère ce profil.
 */
export async function provisionProfileOwner(params: {
  supabase: SupabaseClient<Database>;
  profileId: string;
  currentOwnerId: string | null;
  email: string;
  locale: 'fr' | 'ar';
  actorId: string;
}): Promise<OwnerProvisionResult> {
  const { supabase, profileId, currentOwnerId, email, locale, actorId } = params;
  const admin = createServiceClient();

  // A brand-new account gets a team-known password; an existing one keeps its own.
  const initialPassword = generateOwnerPassword();
  const created = await admin.auth.admin.createUser({
    email,
    password: initialPassword,
    email_confirm: true,
  });
  if (created.error && created.error.status !== 422) return { ok: false, error: 'generic' };
  if (created.data.user) {
    await admin.from('owner_credentials').upsert({
      user_id: created.data.user.id,
      password_cipher: encryptCredential(initialPassword),
      set_by: actorId,
      set_at: new Date().toISOString(),
    });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (linkError || !linkData.user || !linkData.properties.hashed_token) {
    return { ok: false, error: 'generic' };
  }

  const ownerId = linkData.user.id;
  const { data: seller } = await admin.from('sellers').select('id').eq('id', ownerId).maybeSingle();
  if (seller) return { ok: false, error: 'email_is_seller' };

  if (currentOwnerId !== ownerId) {
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ owner_user_id: ownerId })
      .eq('id', profileId)
      .select('id')
      .maybeSingle();
    if (error || !updated) return { ok: false, error: 'generic' };
  }

  const url = new URL('/api/auth/confirm', publicSiteUrl());
  url.searchParams.set('token_hash', linkData.properties.hashed_token);
  url.searchParams.set('type', 'magiclink');
  url.searchParams.set('next', `/${locale}/account`);

  return { ok: true, link: url.toString(), email };
}
