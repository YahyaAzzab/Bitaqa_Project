export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = 'admin' | 'seller';
export type ProfileStatus = 'active' | 'expired' | 'suspended';
export type LinkType =
  | 'phone'
  | 'whatsapp'
  | 'email'
  | 'website'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'linkedin'
  | 'maps'
  | 'custom';
export type SaleKind = 'initial' | 'custom_upgrade' | 'renewal';
export type OrderStatus = 'ordered' | 'in_production' | 'ready' | 'swapped' | 'cancelled';

export type Database = {
  public: {
    Tables: {
      sellers: {
        Row: {
          id: string;
          full_name: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: AppRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: AppRole;
          created_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          code: string;
          name_fr: string;
          name_ar: string;
          price_mad: number;
          renewal_price_mad: number;
          includes_custom_card: boolean;
          active: boolean;
        };
        Insert: {
          code: string;
          name_fr: string;
          name_ar: string;
          price_mad: number;
          renewal_price_mad: number;
          includes_custom_card?: boolean;
          active?: boolean;
        };
        Update: {
          code?: string;
          name_fr?: string;
          name_ar?: string;
          price_mad?: number;
          renewal_price_mad?: number;
          includes_custom_card?: boolean;
          active?: boolean;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          slug: string;
          created_by: string;
          plan_code: string;
          status: ProfileStatus;
          business_name_fr: string;
          business_name_ar: string | null;
          tagline_fr: string | null;
          tagline_ar: string | null;
          address_fr: string | null;
          address_ar: string | null;
          default_lang: 'fr' | 'ar';
          logo_url: string | null;
          accent_color: string;
          theme: string;
          phone: string | null;
          email: string | null;
          hours: Json | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          created_by: string;
          plan_code?: string;
          status?: ProfileStatus;
          business_name_fr: string;
          business_name_ar?: string | null;
          tagline_fr?: string | null;
          tagline_ar?: string | null;
          address_fr?: string | null;
          address_ar?: string | null;
          default_lang?: 'fr' | 'ar';
          logo_url?: string | null;
          accent_color?: string;
          theme?: string;
          phone?: string | null;
          email?: string | null;
          hours?: Json | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          created_by?: string;
          plan_code?: string;
          status?: ProfileStatus;
          business_name_fr?: string;
          business_name_ar?: string | null;
          tagline_fr?: string | null;
          tagline_ar?: string | null;
          address_fr?: string | null;
          address_ar?: string | null;
          default_lang?: 'fr' | 'ar';
          logo_url?: string | null;
          accent_color?: string;
          theme?: string;
          phone?: string | null;
          email?: string | null;
          hours?: Json | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'sellers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_plan_code_fkey';
            columns: ['plan_code'];
            isOneToOne: false;
            referencedRelation: 'plans';
            referencedColumns: ['code'];
          },
        ];
      };
      profile_links: {
        Row: {
          id: string;
          profile_id: string;
          type: LinkType;
          label_fr: string | null;
          label_ar: string | null;
          value: string;
          position: number;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: LinkType;
          label_fr?: string | null;
          label_ar?: string | null;
          value: string;
          position?: number;
        };
        Update: {
          id?: string;
          profile_id?: string;
          type?: LinkType;
          label_fr?: string | null;
          label_ar?: string | null;
          value?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_links_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      sales: {
        Row: {
          id: string;
          profile_id: string;
          seller_id: string;
          plan_code: string;
          kind: SaleKind;
          amount_mad: number;
          collected_at: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          seller_id: string;
          plan_code: string;
          kind?: SaleKind;
          amount_mad: number;
          collected_at?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          seller_id?: string;
          plan_code?: string;
          kind?: SaleKind;
          amount_mad?: number;
          collected_at?: string;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_seller_id_fkey';
            columns: ['seller_id'];
            isOneToOne: false;
            referencedRelation: 'sellers';
            referencedColumns: ['id'];
          },
        ];
      };
      custom_orders: {
        Row: {
          id: string;
          profile_id: string;
          sale_id: string | null;
          status: OrderStatus;
          logo_url: string | null;
          design_notes: string | null;
          ordered_by: string;
          swapped_by: string | null;
          ordered_at: string;
          ready_at: string | null;
          swapped_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          sale_id?: string | null;
          status?: OrderStatus;
          logo_url?: string | null;
          design_notes?: string | null;
          ordered_by: string;
          swapped_by?: string | null;
          ordered_at?: string;
          ready_at?: string | null;
          swapped_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          sale_id?: string | null;
          status?: OrderStatus;
          logo_url?: string | null;
          design_notes?: string | null;
          ordered_by?: string;
          swapped_by?: string | null;
          ordered_at?: string;
          ready_at?: string | null;
          swapped_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'custom_orders_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      cash_handovers: {
        Row: {
          id: string;
          seller_id: string;
          amount_mad: number;
          handed_at: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          seller_id: string;
          amount_mad: number;
          handed_at?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          seller_id?: string;
          amount_mad?: number;
          handed_at?: string;
          note?: string | null;
        };
        Relationships: [];
      };
      scans: {
        Row: {
          id: number;
          profile_id: string;
          scanned_at: string;
          country: string | null;
          device: string | null;
        };
        Insert: {
          id?: never;
          profile_id: string;
          scanned_at?: string;
          country?: string | null;
          device?: string | null;
        };
        Update: {
          id?: never;
          profile_id?: string;
          scanned_at?: string;
          country?: string | null;
          device?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scans_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      seller_cash_balance: {
        Row: {
          seller_id: string | null;
          full_name: string | null;
          collected_mad: number | null;
          handed_over_mad: number | null;
          to_hand_over_mad: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_seller: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      can_manage_profile: { Args: { pid: string }; Returns: boolean };
      create_profile_atomic: {
        Args: {
          p_slug: string;
          p_business_name_fr: string;
          p_business_name_ar?: string | null;
          p_tagline_fr?: string | null;
          p_tagline_ar?: string | null;
          p_address_fr?: string | null;
          p_address_ar?: string | null;
          p_default_lang?: string;
          p_logo_url?: string | null;
          p_accent_color?: string;
          p_theme?: string;
          p_phone?: string | null;
          p_email?: string | null;
          p_hours?: Json | null;
          p_plan_code?: string;
          p_amount_mad?: number;
          p_design_notes?: string | null;
          p_order_logo_url?: string | null;
          p_links?: Json;
        };
        Returns: string;
      };
      renew_profile: {
        Args: {
          p_profile_id: string;
          p_amount_mad: number;
        };
        Returns: null;
      };
      profile_scan_stats: {
        Args: { p_profile_id: string };
        Returns: Json;
      };
      admin_scan_overview: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: {
      app_role: AppRole;
      profile_status: ProfileStatus;
      link_type: LinkType;
      sale_kind: SaleKind;
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Seller = Tables<'sellers'>;
export type Profile = Tables<'profiles'>;
export type ProfileLink = Tables<'profile_links'>;
export type Sale = Tables<'sales'>;
export type CustomOrder = Tables<'custom_orders'>;
export type CashHandover = Tables<'cash_handovers'>;
export type Scan = Tables<'scans'>;
export type Plan = Tables<'plans'>;
