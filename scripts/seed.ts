import { config } from 'dotenv';
import { resolve } from 'node:path';
import type { Database, Json, LinkType } from '../src/lib/supabase/database.types';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

type ServiceClient = ReturnType<typeof import('../src/lib/supabase/service').createServiceClient>;
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

type SeedLink = {
  type: LinkType;
  value: string;
  label_fr?: string;
  label_ar?: string;
};

type SeedProfile = {
  slug: string;
  initials: string;
  accent: string;
  profile: Omit<ProfileInsert, 'created_by' | 'logo_url'>;
  links: SeedLink[];
};

const WEEKDAY_HOURS: Json = {
  mon: [['10:00', '19:00']],
  tue: [['10:00', '19:00']],
  wed: [['10:00', '19:00']],
  thu: [['10:00', '19:00']],
  fri: [['10:00', '19:00']],
  sat: [['10:00', '18:00']],
  sun: [],
};

const SEEDS: SeedProfile[] = [
  {
    slug: 'atelier-nour',
    initials: 'AN',
    accent: '#c9a96e',
    profile: {
      slug: 'atelier-nour',
      plan_code: 'essentiel',
      status: 'active',
      business_name_fr: 'Atelier Nour',
      business_name_ar: 'ورشة نور',
      tagline_fr: 'Pièces uniques, coupe précise.',
      tagline_ar: 'قطع فريدة، قصّ دقيق.',
      address_fr: 'Rue Tétouan, Guéliz, Marrakech',
      address_ar: 'شارع تطوان، كليز، مراكش',
      default_lang: 'fr',
      accent_color: '#c9a96e',
      theme: 'classic',
      phone: '+212661234567',
      email: 'bonjour@atelier-nour.ma',
      hours: WEEKDAY_HOURS,
    },
    links: [
      { type: 'instagram', value: 'https://instagram.com/atelier.nour' },
      { type: 'whatsapp', value: 'https://wa.me/212661234567' },
      { type: 'maps', value: 'https://maps.google.com/?q=Gueliz+Marrakech' },
    ],
  },
  {
    slug: 'studio-lina',
    initials: 'SL',
    accent: '#c4845a',
    profile: {
      slug: 'studio-lina',
      plan_code: 'signature',
      status: 'active',
      business_name_fr: 'Studio Lina',
      business_name_ar: 'استوديو لينا',
      tagline_fr: 'Maquillage de jour, lumières de soir.',
      tagline_ar: 'مكياج النهار، ضوء المساء.',
      address_fr: 'Maarif, Casablanca',
      address_ar: 'المعاريف، الدار البيضاء',
      default_lang: 'ar',
      accent_color: '#c4845a',
      theme: 'classic',
      phone: '+212662345678',
      email: 'hello@studiolina.ma',
      hours: WEEKDAY_HOURS,
    },
    links: [
      { type: 'instagram', value: 'https://instagram.com/studiolina.ma' },
      { type: 'tiktok', value: 'https://www.tiktok.com/@studiolina' },
      { type: 'whatsapp', value: 'https://wa.me/212662345678' },
    ],
  },
  {
    slug: 'cuivre-fil',
    initials: 'CF',
    accent: '#8a9a6a',
    profile: {
      slug: 'cuivre-fil',
      plan_code: 'essentiel',
      status: 'active',
      business_name_fr: 'Cuivre & Fil',
      business_name_ar: 'نحاس وخيط',
      tagline_fr: 'Laiton travaillé à la main, à Fès.',
      tagline_ar: 'نحاس مشغول باليد، في فاس.',
      address_fr: 'Seffarine, Fès médina',
      address_ar: 'الصفارين، فاس المدينة',
      default_lang: 'ar',
      accent_color: '#8a9a6a',
      theme: 'classic',
      phone: '+212663456789',
      hours: WEEKDAY_HOURS,
    },
    links: [
      { type: 'instagram', value: 'https://instagram.com/cuivre.fil' },
      { type: 'website', value: 'https://cuivrefil.ma', label_fr: 'Boutique', label_ar: 'المتجر' },
      { type: 'maps', value: 'https://maps.google.com/?q=Seffarine+Fes' },
    ],
  },
];

function placeholderLogo(initials: string, accent: string): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#141414"/>
  <rect x="24" y="24" width="464" height="464" rx="80" fill="none" stroke="${accent}" stroke-width="8"/>
  <text x="256" y="292" text-anchor="middle" font-family="Georgia, serif" font-size="168" fill="${accent}">${initials}</text>
</svg>`;
  return Buffer.from(svg);
}

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : undefined;
}

async function resolveSellerId(supabase: ServiceClient): Promise<string> {
  const email = flag('seller-email');
  if (email) {
    const { data, error } = await supabase.from('sellers').select('id, full_name');
    if (error) throw error;
    const listed = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listed.error) throw listed.error;
    const user = listed.data.users.find(
      (item) => item.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!user) {
      throw new Error(`Aucun compte auth pour ${email}. Créez-le avec npm run seller:create.`);
    }
    const seller = data.find((row) => row.id === user.id);
    if (!seller) {
      throw new Error(`${email} n’a pas de ligne sellers.`);
    }
    return seller.id;
  }

  const { data, error } = await supabase
    .from('sellers')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  const first = data[0];
  if (!first) {
    throw new Error('Aucun vendeur en base. Lancez npm run seller:create avant le seed.');
  }
  return first.id;
}

async function main() {
  const { createServiceClient } = await import('../src/lib/supabase/service');
  const supabase = createServiceClient();
  const sellerId = await resolveSellerId(supabase);

  for (const seed of SEEDS) {
    const path = `${seed.slug}/logo.svg`;
    const upload = await supabase.storage
      .from('logos')
      .upload(path, placeholderLogo(seed.initials, seed.accent), {
        contentType: 'image/svg+xml',
        upsert: true,
      });
    if (upload.error) throw upload.error;

    const publicUrl = supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          ...seed.profile,
          created_by: sellerId,
          logo_url: publicUrl,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();

    if (profileError || !profile) {
      throw profileError ?? new Error(`Échec du profil ${seed.slug}`);
    }

    const { error: deleteLinksError } = await supabase
      .from('profile_links')
      .delete()
      .eq('profile_id', profile.id);
    if (deleteLinksError) throw deleteLinksError;

    const { error: linksError } = await supabase.from('profile_links').insert(
      seed.links.map((link, position) => ({
        profile_id: profile.id,
        type: link.type,
        value: link.value,
        label_fr: link.label_fr ?? null,
        label_ar: link.label_ar ?? null,
        position,
      })),
    );
    if (linksError) throw linksError;
  }

  process.stdout.write(`Seed OK — 3 profils rattachés au vendeur ${sellerId}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Erreur inconnue';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
