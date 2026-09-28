'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { provisionProfileOwner } from '@/features/profiles/owner-provision';
import { getSellerSession } from '@/lib/auth/session';
import { normalizeMoroccanPhone } from '@/lib/phone';
import { isReservedSlug, isValidSlug } from '@/lib/profile/slug';
import { buildLinksPayload, emptyToNull } from '@/lib/profile/links-payload';
import { themeToDb } from '@/lib/profile/theme';
import { wizardFormSchema, type WizardFormValues } from '@/lib/profile/schema';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function checkSlugAvailable(
  slug: string,
): Promise<ActionResult<{ available: boolean }>> {
  const session = await getSellerSession();
  if (!session) return { ok: false, error: 'unauthorized' };

  const cleaned = slug.trim().toLowerCase();
  if (!isValidSlug(cleaned) || isReservedSlug(cleaned)) {
    return { ok: true, data: { available: false } };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', cleaned)
    .maybeSingle();

  if (error) return { ok: false, error: 'generic' };
  return { ok: true, data: { available: !data } };
}

export type CreatedProfile = {
  id: string;
  slug: string;
  owner: { link: string; email: string } | { error: string } | null;
};

export async function createProfile(raw: WizardFormValues): Promise<ActionResult<CreatedProfile>> {
  const session = await getSellerSession();
  if (!session) return { ok: false, error: 'unauthorized' };

  const parsed = wizardFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'invalid' };
  }

  const values = parsed.data;
  const phone = normalizeMoroccanPhone(values.phone);
  if (!phone) return { ok: false, error: 'phone_invalid' };

  const supabase = await createServerSupabaseClient();
  const { data: profileId, error } = await supabase.rpc('create_profile_atomic', {
    p_slug: values.slug,
    p_business_name_fr: values.businessNameFr,
    p_business_name_ar: emptyToNull(values.businessNameAr),
    p_tagline_fr: emptyToNull(values.taglineFr),
    p_tagline_ar: emptyToNull(values.taglineAr),
    p_address_fr: emptyToNull(values.addressFr),
    p_address_ar: null,
    p_default_lang: values.defaultLang,
    p_logo_url: values.logoUrl ?? null,
    p_accent_color: values.accentColor,
    p_theme: themeToDb(values.theme),
    p_phone: phone,
    p_email: emptyToNull(values.email),
    p_hours: values.hoursEnabled ? (values.hours as Json) : null,
    p_plan_code: values.planCode,
    p_amount_mad: values.amountMad,
    p_design_notes: emptyToNull(values.designNotes),
    p_order_logo_url: values.logoUrl ?? null,
    p_links: buildLinksPayload(values),
  });

  if (error) {
    if (error.message.includes('slug_taken')) return { ok: false, error: 'slug_taken' };
    return { ok: false, error: 'generic' };
  }

  if (!profileId) return { ok: false, error: 'generic' };

  // The sale is already recorded: an account failure must not undo it, the seller retries from the ready screen.
  let owner: CreatedProfile['owner'] = null;
  if (values.clientAccess && values.ownerEmail) {
    const provisioned = await provisionProfileOwner({
      supabase,
      profileId,
      currentOwnerId: null,
      email: values.ownerEmail,
      locale: values.defaultLang,
    });
    owner = provisioned.ok
      ? { link: provisioned.link, email: provisioned.email }
      : { error: provisioned.error };
  }

  revalidateTag(`profile:${values.slug}`);
  revalidatePath(`/fr/${values.slug}`);
  revalidatePath(`/ar/${values.slug}`);
  revalidatePath('/fr/dashboard');
  revalidatePath('/ar/dashboard');
  revalidatePath('/fr/dashboard/profiles');
  revalidatePath('/ar/dashboard/profiles');

  return { ok: true, data: { id: profileId, slug: values.slug, owner } };
}

export async function uploadLogo(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const session = await getSellerSession();
  if (!session) return { ok: false, error: 'unauthorized' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'file_missing' };
  }
  if (file.size > 500_000) {
    return { ok: false, error: 'file_too_large' };
  }
  // Après compression client : webp/jpeg/png ; vide sur certains WebView mobiles.
  const type = file.type || 'image/jpeg';
  if (!['image/webp', 'image/jpeg', 'image/png', 'image/jpg'].includes(type) && type !== '') {
    return { ok: false, error: 'file_type' };
  }

  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${session.userId}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createServerSupabaseClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from('logos').upload(path, buffer, {
    contentType: type === 'image/jpg' ? 'image/jpeg' : type || 'image/jpeg',
    upsert: false,
  });

  if (error) return { ok: false, error: 'upload_failed' };

  const { data } = supabase.storage.from('logos').getPublicUrl(path);
  return { ok: true, data: { url: data.publicUrl } };
}
