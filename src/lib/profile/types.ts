import type { LinkType, Profile, ProfileLink } from '@/lib/supabase/database.types';
import type { WeeklyHours } from './hours';

export type PublicProfileLink = Pick<
  ProfileLink,
  'id' | 'type' | 'label_fr' | 'label_ar' | 'value' | 'position'
>;

export type PublicProfile = Pick<
  Profile,
  | 'id'
  | 'slug'
  | 'status'
  | 'business_name_fr'
  | 'business_name_ar'
  | 'tagline_fr'
  | 'tagline_ar'
  | 'address_fr'
  | 'address_ar'
  | 'default_lang'
  | 'logo_url'
  | 'accent_color'
  | 'theme'
  | 'phone'
  | 'email'
  | 'expires_at'
> & {
  hours: WeeklyHours | null;
  links: PublicProfileLink[];
};

export type ProfilePreviewData = {
  businessNameFr: string;
  businessNameAr?: string;
  taglineFr?: string;
  taglineAr?: string;
  addressFr?: string;
  addressAr?: string;
  logoUrl?: string | null;
  accentColor: string;
  theme: 'noir' | 'ivoire';
  phone?: string;
  email?: string;
  links: Array<{
    type: LinkType;
    labelFr?: string;
    labelAr?: string;
    value: string;
  }>;
  hours?: WeeklyHours | null;
  expired?: boolean;
};
