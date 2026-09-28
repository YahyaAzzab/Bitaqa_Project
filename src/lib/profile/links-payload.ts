import { normalizeMoroccanPhone } from '@/lib/phone';
import { toWhatsAppHref } from '@/lib/profile/urls';
import type { Json } from '@/lib/supabase/database.types';

type LinkInput = {
  type: string;
  labelFr?: string;
  labelAr?: string;
  value: string;
};

type ContactInput = {
  phone: string;
  whatsappSame: boolean;
  whatsapp?: string;
  email?: string;
  mapsUrl?: string;
  links: LinkInput[];
};

export function emptyToNull(v: string | undefined | null): string | null {
  const t = v?.trim();
  return t ? t : null;
}

/** Les coordonnées deviennent des liens système en tête, puis les liens libres dans l'ordre choisi. */
export function buildLinksPayload(values: ContactInput): Json {
  const links: Array<{
    type: string;
    label_fr: string | null;
    label_ar: string | null;
    value: string;
  }> = [];
  const push = (type: string, value: string) =>
    links.push({ type, label_fr: null, label_ar: null, value });

  const phone = normalizeMoroccanPhone(values.phone);
  if (phone) push('phone', phone);

  const waRaw = values.whatsappSame ? values.phone : values.whatsapp;
  const wa = waRaw ? normalizeMoroccanPhone(waRaw) : null;
  if (wa) push('whatsapp', toWhatsAppHref(wa));

  if (values.email?.trim()) push('email', values.email.trim());
  if (values.mapsUrl?.trim()) push('maps', values.mapsUrl.trim());

  for (const link of values.links) {
    links.push({
      type: link.type,
      label_fr: emptyToNull(link.labelFr),
      label_ar: emptyToNull(link.labelAr),
      value: link.value.trim(),
    });
  }

  return links;
}
