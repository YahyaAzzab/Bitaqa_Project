-- Espace client : chaque commerçant édite sa propre carte.
-- Les clients n'écrivent jamais directement dans les tables : tout passe par
-- owner_update_profile, qui n'accepte que les champs éditables.

alter table profiles
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

create index if not exists profiles_owner_idx on profiles (owner_user_id);

alter table profiles drop constraint if exists slug_reserved;
alter table profiles add constraint slug_reserved check (slug <> all (array[
  'admin', 'api', 'app', 'login', 'dashboard', 'c', 'new', 'static', 'assets', '_next',
  'account', 'auth'
])) not valid;

create or replace function public.is_profile_owner(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
     and exists (select 1 from profiles where id = pid and owner_user_id = auth.uid());
$$;

create or replace function public.owns_any_profile() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
     and exists (select 1 from profiles where owner_user_id = auth.uid());
$$;

-- Lecture de sa propre carte, même suspendue (pour afficher l'état).
drop policy if exists profiles_owner_read on profiles;
create policy profiles_owner_read on profiles
  for select using (owner_user_id = auth.uid());

drop policy if exists links_owner_read on profile_links;
create policy links_owner_read on profile_links
  for select using (is_profile_owner(profile_id));

drop policy if exists scans_owner_read on scans;
create policy scans_owner_read on scans
  for select using (is_profile_owner(profile_id));

-- Logos des clients : dossier owners/{uid}/ uniquement.
drop policy if exists logos_owner_insert on storage.objects;
create policy logos_owner_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = 'owners'
    and (storage.foldername(name))[2] = auth.uid()::text
    and owns_any_profile()
  );

create or replace function public.owner_update_profile(
  p_profile_id uuid,
  p_business_name_fr text,
  p_business_name_ar text,
  p_tagline_fr text,
  p_tagline_ar text,
  p_address_fr text,
  p_logo_url text,
  p_accent_color text,
  p_theme text,
  p_phone text,
  p_email text,
  p_hours jsonb,
  p_links jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_link jsonb;
  v_pos smallint := 0;
  v_type text;
  v_value text;
begin
  if auth.uid() is null then
    raise exception 'forbidden';
  end if;

  select * into v_profile from profiles where id = p_profile_id for update;
  if not found or v_profile.owner_user_id is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;

  if v_profile.status <> 'active' or v_profile.expires_at <= now() then
    raise exception 'profile_inactive';
  end if;

  if char_length(coalesce(trim(p_business_name_fr), '')) not between 2 and 80
     or char_length(coalesce(p_business_name_ar, '')) > 80
     or char_length(coalesce(p_tagline_fr, '')) > 120
     or char_length(coalesce(p_tagline_ar, '')) > 120
     or char_length(coalesce(p_address_fr, '')) > 200
     or char_length(coalesce(p_email, '')) > 200
     or coalesce(p_accent_color, '') !~ '^#[0-9a-fA-F]{6}$'
     or p_theme <> all (array[
       'noir', 'ivoire', 'sable', 'rose', 'sauge', 'marbre', 'menthe',
       'emeraude', 'nuit', 'bordeaux', 'argile', 'ardoise'
     ])
     or (p_phone is not null and p_phone !~ '^\+212[5-8][0-9]{8}$')
     or (p_logo_url is not null and p_logo_url !~ '^https://')
     or (p_hours is not null and jsonb_typeof(p_hours) <> 'object')
     or jsonb_typeof(coalesce(p_links, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_links, '[]'::jsonb)) > 20
  then
    raise exception 'invalid';
  end if;

  update profiles set
    business_name_fr = trim(p_business_name_fr),
    business_name_ar = nullif(trim(p_business_name_ar), ''),
    tagline_fr = nullif(trim(p_tagline_fr), ''),
    tagline_ar = nullif(trim(p_tagline_ar), ''),
    address_fr = nullif(trim(p_address_fr), ''),
    logo_url = p_logo_url,
    accent_color = p_accent_color,
    theme = p_theme,
    phone = p_phone,
    email = nullif(trim(p_email), ''),
    hours = p_hours
  where id = p_profile_id;

  delete from profile_links where profile_id = p_profile_id;

  for v_link in select * from jsonb_array_elements(coalesce(p_links, '[]'::jsonb))
  loop
    v_type := v_link->>'type';
    v_value := coalesce(v_link->>'value', '');
    if char_length(v_value) not between 1 and 500
       or char_length(coalesce(v_link->>'label_fr', '')) > 60
       or char_length(coalesce(v_link->>'label_ar', '')) > 60
       or (v_type not in ('email', 'phone') and v_value !~* '^(https://|tel:|mailto:)')
    then
      raise exception 'invalid_link';
    end if;

    insert into profile_links (profile_id, type, label_fr, label_ar, value, position)
    values (
      p_profile_id,
      v_type::link_type,
      nullif(v_link->>'label_fr', ''),
      nullif(v_link->>'label_ar', ''),
      v_value,
      v_pos
    );
    v_pos := v_pos + 1;
  end loop;

  return v_profile.slug;
end;
$$;

revoke all on function public.owner_update_profile from public;
grant execute on function public.owner_update_profile to authenticated;

-- Les statistiques restent agrégées ; le propriétaire voit celles de sa carte.
create or replace function public.profile_scan_stats(p_profile_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not (can_manage_profile(p_profile_id) or is_profile_owner(p_profile_id)) then null
    else jsonb_build_object(
      'scans_7', (
        select count(*) from scans
        where profile_id = p_profile_id and scanned_at >= now() - interval '7 days'
      ),
      'scans_30', (
        select count(*) from scans
        where profile_id = p_profile_id and scanned_at >= now() - interval '30 days'
      ),
      'by_country', coalesce((
        select jsonb_object_agg(coalesce(country, '??'), c) from (
          select country, count(*)::int as c from scans
          where profile_id = p_profile_id and scanned_at >= now() - interval '30 days'
          group by country
        ) s
      ), '{}'::jsonb),
      'by_device', coalesce((
        select jsonb_object_agg(coalesce(device, '??'), c) from (
          select device, count(*)::int as c from scans
          where profile_id = p_profile_id and scanned_at >= now() - interval '30 days'
          group by device
        ) s
      ), '{}'::jsonb),
      'daily', coalesce((
        select jsonb_agg(jsonb_build_object('day', d, 'count', c) order by d) from (
          select date_trunc('day', scanned_at)::date as d, count(*)::int as c
          from scans
          where profile_id = p_profile_id and scanned_at >= now() - interval '30 days'
          group by 1
        ) s
      ), '[]'::jsonb)
    )
  end;
$$;

revoke all on function public.profile_scan_stats from public;
grant execute on function public.profile_scan_stats to authenticated;
