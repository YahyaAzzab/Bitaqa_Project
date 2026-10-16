-- Fond de page facultatif, géré par le commerçant depuis son espace.
-- Idempotent : safe to re-run after a failed attempt.

alter table public.profiles
  add column if not exists background_url text;

-- Ancienne signature (sans background) : uuid + 10 text + 2 jsonb
drop function if exists public.owner_update_profile(
  uuid, text, text, text, text, text, text, text, text, text, text, jsonb, jsonb
);

-- Nouvelle signature (avec background) si un run partiel l’a déjà créée
drop function if exists public.owner_update_profile(
  uuid, text, text, text, text, text, text, text, text, text, text, text, jsonb, jsonb
);

create function public.owner_update_profile(
  p_profile_id uuid,
  p_business_name_fr text,
  p_business_name_ar text,
  p_tagline_fr text,
  p_tagline_ar text,
  p_address_fr text,
  p_logo_url text,
  p_background_url text,
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
     or (p_background_url is not null and p_background_url !~ '^https://')
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
    background_url = p_background_url,
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

revoke all on function public.owner_update_profile(
  uuid, text, text, text, text, text, text, text, text, text, text, text, jsonb, jsonb
) from public;

grant execute on function public.owner_update_profile(
  uuid, text, text, text, text, text, text, text, text, text, text, text, jsonb, jsonb
) to authenticated;

-- Nettoyage du fond lors de la suppression admin.
drop function if exists public.admin_delete_profile(uuid);

create function public.admin_delete_profile(p_profile_id uuid)
returns table (slug text, logo_url text, background_url text, owner_user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  select * into v_profile from profiles where id = p_profile_id for update;
  if not found then
    raise exception 'not_found';
  end if;

  update sales
  set profile_name = coalesce(profile_name, v_profile.business_name_fr)
  where profile_id = p_profile_id;

  delete from profiles where id = p_profile_id;

  return query
  select v_profile.slug, v_profile.logo_url, v_profile.background_url, v_profile.owner_user_id;
end;
$$;

revoke all on function public.admin_delete_profile(uuid) from public;
grant execute on function public.admin_delete_profile(uuid) to authenticated;
