-- =====================================================================
-- Plateforme cartes NFC : schéma Supabase (Postgres)
-- A exécuter dans Supabase > SQL Editor
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Types ----------
create type app_role       as enum ('admin', 'seller');
create type profile_status as enum ('active', 'expired', 'suspended');
create type link_type      as enum (
  'phone', 'whatsapp', 'email', 'website', 'instagram',
  'facebook', 'tiktok', 'linkedin', 'maps', 'custom'
);
create type sale_kind      as enum ('initial', 'custom_upgrade', 'renewal');
create type order_status   as enum ('ordered', 'in_production', 'ready', 'swapped', 'cancelled');

-- ---------- Vendeurs (lié à auth.users) ----------
create table sellers (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  role       app_role not null default 'seller',
  created_at timestamptz not null default now()
);

-- ---------- Plans ----------
create table plans (
  code                 text primary key,
  name_fr              text not null,
  name_ar              text not null,
  price_mad            integer not null check (price_mad >= 0),
  renewal_price_mad    integer not null check (renewal_price_mad >= 0),
  includes_custom_card boolean not null default false,
  active               boolean not null default true
);

-- Prix indicatifs, à ajuster selon ton coût réel
insert into plans (code, name_fr, name_ar, price_mad, renewal_price_mad, includes_custom_card) values
  ('essentiel', 'Essentiel', 'أساسي',  149, 60, false),
  ('signature', 'Signature', 'سيغنتشر', 299, 60, true);

-- ---------- Fonctions d'accès ----------
create or replace function is_seller() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from sellers where id = auth.uid());
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from sellers where id = auth.uid() and role = 'admin');
$$;

-- ---------- Profils ----------
create table profiles (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  created_by     uuid not null references sellers(id),
  plan_code      text not null references plans(code) default 'essentiel',
  status         profile_status not null default 'active',

  -- Contenu bilingue
  business_name_fr text not null,
  business_name_ar text,
  tagline_fr       text,
  tagline_ar       text,
  address_fr       text,
  address_ar       text,
  default_lang     text not null default 'fr' check (default_lang in ('fr', 'ar')),

  -- Apparence
  logo_url       text,
  accent_color   text not null default '#111111',
  theme          text not null default 'classic',

  -- Coordonnées principales (pour la vCard)
  phone          text,
  email          text,
  hours          jsonb,

  expires_at     timestamptz not null default (now() + interval '1 year'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 40),
  constraint slug_reserved check (slug <> all (array[
    'admin', 'api', 'app', 'login', 'dashboard', 'c', 'new', 'static', 'assets', '_next'
  ]))
);

create index profiles_created_by_idx on profiles (created_by);

-- ---------- Liens du profil ----------
create table profile_links (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type       link_type not null,
  label_fr   text,
  label_ar   text,
  value      text not null,
  position   smallint not null default 0
);

create index profile_links_profile_idx on profile_links (profile_id, position);

-- ---------- Ventes (cash uniquement) ----------
create table sales (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id),
  seller_id    uuid not null references sellers(id),
  plan_code    text not null references plans(code),
  kind         sale_kind not null default 'initial',
  amount_mad   integer not null check (amount_mad >= 0),
  collected_at timestamptz not null default now(),
  note         text
);

create index sales_seller_idx  on sales (seller_id, collected_at desc);
create index sales_profile_idx on sales (profile_id);

-- ---------- Commandes de carte personnalisée ----------
-- Flux : carte standard remise sur place, puis échange contre la carte imprimée.
create table custom_orders (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id),
  sale_id      uuid references sales(id),
  status       order_status not null default 'ordered',
  logo_url     text,
  design_notes text,
  ordered_by   uuid not null references sellers(id),
  swapped_by   uuid references sellers(id),
  ordered_at   timestamptz not null default now(),
  ready_at     timestamptz,
  swapped_at   timestamptz
);

create index custom_orders_status_idx on custom_orders (status);

-- ---------- Remises d'espèces (suivi de caisse entre vendeurs) ----------
create table cash_handovers (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references sellers(id),
  amount_mad  integer not null check (amount_mad > 0),
  handed_at   timestamptz not null default now(),
  note        text
);

-- ---------- Scans (écrits côté serveur uniquement, service role) ----------
create table scans (
  id         bigint generated always as identity primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  country    text,
  device     text
);

create index scans_profile_idx on scans (profile_id, scanned_at desc);

-- ---------- Vue : solde de caisse par vendeur ----------
create view seller_cash_balance with (security_invoker = true) as
select
  s.id as seller_id,
  s.full_name,
  coalesce((select sum(amount_mad) from sales          where seller_id = s.id), 0) as collected_mad,
  coalesce((select sum(amount_mad) from cash_handovers where seller_id = s.id), 0) as handed_over_mad,
  coalesce((select sum(amount_mad) from sales          where seller_id = s.id), 0)
  - coalesce((select sum(amount_mad) from cash_handovers where seller_id = s.id), 0) as to_hand_over_mad
from sellers s;

-- ---------- Trigger updated_at ----------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

-- ---------- Sécurité par ligne (RLS) ----------
alter table sellers        enable row level security;
alter table plans          enable row level security;
alter table profiles       enable row level security;
alter table profile_links  enable row level security;
alter table sales          enable row level security;
alter table custom_orders  enable row level security;
alter table cash_handovers enable row level security;
alter table scans          enable row level security;

create or replace function can_manage_profile(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin()
      or exists (select 1 from profiles where id = pid and created_by = auth.uid());
$$;

-- sellers
create policy sellers_read_self_or_admin on sellers
  for select using (id = auth.uid() or is_admin());
create policy sellers_admin_write on sellers
  for all using (is_admin()) with check (is_admin());

-- plans : lecture publique
create policy plans_public_read on plans for select using (true);

-- profiles : lecture publique (sauf suspendus), écriture par le créateur ou l'admin
create policy profiles_public_read on profiles
  for select using (status <> 'suspended' or can_manage_profile(id));
create policy profiles_seller_insert on profiles
  for insert with check (is_seller() and created_by = auth.uid());
create policy profiles_manage_update on profiles
  for update using (can_manage_profile(id)) with check (can_manage_profile(id));
create policy profiles_admin_delete on profiles
  for delete using (is_admin());

-- profile_links
create policy links_public_read on profile_links
  for select using (
    exists (select 1 from profiles p
            where p.id = profile_id and (p.status <> 'suspended' or can_manage_profile(p.id)))
  );
create policy links_manage_write on profile_links
  for all using (can_manage_profile(profile_id)) with check (can_manage_profile(profile_id));

-- sales : chaque vendeur voit et crée les siennes, l'admin voit tout
create policy sales_read on sales
  for select using (seller_id = auth.uid() or is_admin());
create policy sales_insert on sales
  for insert with check (is_seller() and seller_id = auth.uid());

-- custom_orders : les deux vendeurs peuvent voir et traiter l'échange
create policy orders_seller_read on custom_orders
  for select using (is_seller());
create policy orders_seller_insert on custom_orders
  for insert with check (is_seller() and ordered_by = auth.uid());
create policy orders_seller_update on custom_orders
  for update using (is_seller()) with check (is_seller());

-- cash_handovers : lecture perso ou admin, écriture admin
create policy handovers_read on cash_handovers
  for select using (seller_id = auth.uid() or is_admin());
create policy handovers_admin_write on cash_handovers
  for all using (is_admin()) with check (is_admin());

-- scans : lecture pour qui gère le profil (insertion via service role, qui contourne la RLS)
create policy scans_read on scans
  for select using (can_manage_profile(profile_id));

-- ---------- Stockage des logos ----------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy logos_public_read on storage.objects
  for select using (bucket_id = 'logos');
create policy logos_seller_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'logos' and is_seller());
create policy logos_seller_update on storage.objects
  for update to authenticated using (bucket_id = 'logos' and is_seller());